## Questions

### What issues, if any, did you find with the existing code?

The code was already standard and functional, so I focused on adding input validations in the frontend along with error alerts to clearly inform the user when something is wrong. In the backend, I implemented the same validations to ensure that malicious users couldn’t bypass the frontend checks.

### What issues, if any, did you find with the request to add functionality?

The main issue was that the database had no way to track how much had been withdrawn in a single day or when the last transaction occurred, so I had to modify the schema to include this information. Aside from that, the restrictions were fairly easy to implement since the groundwork was already in place and I was primarily validating input.

### Would you modify the structure of this project if you were to start it over? If so, how?

I would host the frontend, backend, and database in separate locations, and I would make the backend middleware serverless by using a Lambda function. This setup would help system availability and take advantage of AWS’s global infrastructure. Other than that, the project is fairly standard and well structured.

### Were there any pieces of this project that you were not able to complete that you'd like to mention?

n/a

### If you were to continue building this out, what would you like to add next?

I would next add detailed error handling in the backend, including custom error classes and consistent try/catch blocks in both the frontend and backend to ensure the user experience is never interrupted. After that, I could begin introducing additional features such as multiple account types under a single user, a full transaction ledger, account-blocking functionality, and more.

### If you have any other comments or info you'd like the reviewers to know, please add them below.

n/a
