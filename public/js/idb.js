// create variable to hold db connection
let db;
// establish a connection to indexeddb called budget tracker
const request = indexedDB.open('budget_tracker', 1);

// this event will emit if the database version changes
request.onupgradeneeded = function(event) {
    //save reference to the database
    const db = event.target.result;
    //create an object store called new budget
    db.createObjectStore('new_budget', { autoIncrement: true });
}

// upon success
request.onsuccess = function(event) {
    // when db is successfully created with its object store
    db = event.target.result;

    //check if app is online, if yes run uploadBudget() to send all local db data to api
    if (navigator.onLine) {
        //uploadBudget();
    }
}

request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode)
}

// this function will run if we attempt to submit new budget info and there's no internet connection
function saveRecord(record) {
    // open new transaction with database
    const transaction = db.transaction(['new_budget'], 'readwrite');

    // access the object store
    const budgetObjectStore = transaction.objectStore('new_budget');

    // add record to store
    budgetObjectStore.add(record);
}

function uploadBudget() {
    // open transaction in db
    const transaction = db.transaction(['new_budget'], 'readwrite');

    // access object store
    const budgetObjectStore = transaction.objectStore('new_budget');

    // get all records from store and set to variable
    const getAll = budgetObjectStore.getAll()

    // upon a successful getall execution
    getAll.onsuccess = function() {
        // if there was data in indexeddb send it to api server
        if(getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open one more transaction
                const transaction = db.transaction(['new_budget'], 'readwrite');
                //access the new pizza object store
                const budgetObjectStore = transaction.objectStore('new_budget');
                // clear all items in store
                budgetObjectStore.clear();

                alert('All saved transactions have been submitted!');
            })
            .catch(err => {
                console.log(err);
            })
        }
    }
}

// listen for app coming back online
window.addEventListener('online', uploadBudget);