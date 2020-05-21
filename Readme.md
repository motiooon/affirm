### Affirm's Code Exercise:

---

#### Installation and Running the Code:

```js
    npm install
    node index.js
```

After that the 2 CSV files will be added to the root folder of the program.

----

#### Answers to questions

1. How long did you spend working on the problem? What did you find to be the most difficult part?
> Took me ~6 hours. I did not track time precisely but this is the ballpark. It would have taken me more, if I had written unit tests or further optimize on time complexity of the code. Most time went into parsing CSVs, massaging/transforming data, cleaning up code.
2. How would you modify your data model or code to account for an eventual introduction of new, as-of-yet unknown types of covenants, beyond just maximum default likelihood and state restrictions?
In my program I keep the data in memory after initial ingestion, this is not scalable, so most likely I would keep all of these into a database, prefferably document/NoSQL so I can alter the schema without downtime. Then the algorithm would have to account for the distribution of that data instead of loading everything in memory. If Availability is key for this then adding unforeseen covenants into the data model would make it tricky.  
3. How would you architect your solution as a production service wherein new facilities can be introduced at arbitrary points in time. Assume these facilities become available by the finance team emailing your team and describing the addition with a new set of CSVs.
> For introducing new facilities and covenants I would make available ingestion endpoints in the API/service. Ingestion would take the CSV and insert it into the database. And after that I would have some sort of worker processes that would add the new data where it needs to be, i.e. Cache, additional tables, algorithm passthroughs
4. Your solution most likely simulates the streaming process by directly calling a method in your code to process the loans inside of a for loop. What would a REST API look like for this same service? Stakeholders using the API will need, at a minimum, to be able to request a loan be assigned to a facility, and read the funding status of a loan, as well as query the capacities remaining in facilities.
> Well you have your answer right in the question there, I would provide secure API endpoints for each of the use case you mention 
5. How might you improve your assignment algorithm if you were permitted to assign loans in batch rather than streaming? We are not looking for code here, but pseudo code or description of a revised algorithm appreciated.
> Batching would only work, for the purpose of maximize yield, as we can only grant loans that are most profitable. Otherwise using batch does not add any material value. The assignment algorithm would look at the batch and sort by yield, and then grant loans based on that rather than first come, first served. 
6. Discuss your solution’s runtime complexity.
> Solution makes a map of all covenants let's say where k is the number of covenants that is O(k), then for each loan of n length looks in all the facilities with length f. For each facility:covenant pair looks at all banned states, with max length of 50. Overall time complexity is **O(k + (n * f) + 50)**. Everything other than that is negligible.  