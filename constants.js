module.exports.BANKS = './assets/large/banks.csv'
module.exports.COVENANTS = './assets/large/covenants.csv'
module.exports.FACILITIES = './assets/large/facilities.csv'
module.exports.LOANS = './assets/large/loans.csv'

module.exports.BANKS_COLUMNS = ['id', 'name']
module.exports.COVENANTS_COLUMNS = ['facilityId', 'maxDefaultLikelihood', 'bankId', 'bannedState']
module.exports.FACILITIES_COLUMNS = ['amount', 'interestRate', 'id', 'bankId']
module.exports.LOANS_COLUMNS = ['interestRate', 'amount', 'id', 'defaultLikelihood', 'state']