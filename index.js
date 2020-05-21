const fs = require('fs')
const csv = require('csv-parser')
const createCsvWriter = require('csv-writer').createObjectCsvWriter

const {
  FACILITIES,
  COVENANTS,
  LOANS,
  FACILITIES_COLUMNS,
  COVENANTS_COLUMNS,
  LOANS_COLUMNS
} = require('./constants')

/**
 *
 * @param filePath string
 * @param columns array<strings>
 * @returns {Promise<unknown>}
 */
async function ingestFile (filePath, columns) {
  const resultList = []

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ headers: columns, skipLines: 1 }))
      .on('data', (data) => resultList.push(data))
      .on('end', () => { resolve(resultList) })
      .on('error', (e) => { reject(e) })
  })
}

/**
 *
 * @param facilities string
 * @param covenants string
 * @param loans string
 * @returns {Promise<{covenants: *, banks: *, loans: *, facilities: *}>}
 */
const ingestData = async (facilities, covenants, loans) => {
  const [
    _facilities,
    _covenants,
    _loans
  ] = await Promise.all([
    ingestFile(facilities, FACILITIES_COLUMNS),
    ingestFile(covenants, COVENANTS_COLUMNS),
    ingestFile(loans, LOANS_COLUMNS)
  ])

  return {
    facilities: _facilities,
    covenants: _covenants,
    loans: _loans
  }
}

/**
 *
 * @param loan Loan object
 * @param facility Facility object
 * @returns {number}
 */
function calculateYield (loan, facility) {
  const { interestRate, amount, defaultLikelihood } = loan
  const fir = facility.interestRate
  return (1 - defaultLikelihood) *
         (interestRate * amount) -
         (defaultLikelihood * amount) -
         (fir * amount)
}

/**
 *
 * @param params object
 * @param data []object
 */
function writeOutput (params, data) {
  const writer = createCsvWriter(params)
  writer
    .writeRecords(data)
    .then(() => console.log(`The ${params.path} file was written successfully`))
}

ingestData(FACILITIES, COVENANTS, LOANS).then((data) => {
  // We just need the 3, we do not need that banks csv
  const { facilities, covenants, loans } = data

  // Make a map for O(1) access of each facility:covenant
  const facilitiesMap = {}

  for (let i = 0; i < covenants.length; i++) {
    const cov = covenants[i]
    const fid = 'facilityId'
    const bs = 'bannedState'

    // If covenant is in the map just update the banned states and max default
    if (facilitiesMap[cov[fid]] !== undefined) {
      facilitiesMap[cov[fid]].bannedStates.push(cov[bs])
      const mdl = facilitiesMap[cov[fid]].maxDefaultLikelihood
      facilitiesMap[cov[fid]].maxDefaultLikelihood = Math.max(cov.maxDefaultLikelihood, mdl)
    } else {
      // Initialize the covenant in the map with the first value
      facilitiesMap[cov[fid]] = {
        bannedStates: [cov[bs]],
        maxDefaultLikelihood: Number(cov.maxDefaultLikelihood)
      }
    }
  }

  // Will use these 2 for the output data
  const loansToFacilities = []
  const facilitiesYield = {}

  for (let i = 0; i < loans.length; i++) {
    let maxYield = 0
    let electedFacility
    let winningYield
    const loan = loans[i]

    for (let f = 0; f < facilities.length; f++) {
      const facility = facilities[f]

      if (
        // facility still has money available to lend
        Number(facility.amount) > Number(loan.amount) &&
        // facility:covenant does not ban the loan state through covenant
        facilitiesMap[facility.id].bannedStates.indexOf(loan.state) === -1 &&
        // facility:covenant has higher max default than the current loan
        Number(facilitiesMap[facility.id].maxDefaultLikelihood) >= Number(loan.defaultLikelihood)
      ) {
        const currentYield = calculateYield(loan, facility)
        maxYield = Math.max(currentYield, maxYield)

        if (maxYield === currentYield) {
          electedFacility = facility
          winningYield = currentYield
        }
      }
    }

    // if the maxYield is still 0 means we did not find a facility, otherwise we did and we store that
    if (maxYield !== 0) {
      // store the loan:facility pair in memory for writing to file later
      loansToFacilities.push({
        loan_id: loan.id,
        facility_id: electedFacility.id
      })

      // subtract loan amount from the total facility
      electedFacility.amount -= loan.amount

      // accumulate yields for each facility
      if (facilitiesYield[electedFacility.id] !== undefined) {
        facilitiesYield[electedFacility.id].expectedYield += winningYield
      } else {
        facilitiesYield[electedFacility.id] = { expectedYield: winningYield }
      }
    }
  }

  // massage the object into an array so we can make it a csv
  const facilitiesYieldList = []
  Object.keys(facilitiesYield).forEach((value, index) => {
    facilitiesYieldList.push({
      facility_id: value,
      expected_yield: Math.round(facilitiesYield[value].expectedYield)
    })
  })

  // Write the 2 CSV files needed

  const loanParams = {
    path: 'assignments.csv',
    header: [
      { id: 'loan_id', title: 'loan_id' },
      { id: 'facility_id', title: 'facility_id' }
    ]
  }

  const yieldParams = {
    path: 'yields.csv',
    header: [
      { id: 'facility_id', title: 'facility_id' },
      { id: 'expected_yield', title: 'expected_yield' }
    ]
  }

  writeOutput(loanParams, loansToFacilities)
  writeOutput(yieldParams, facilitiesYieldList)
})
