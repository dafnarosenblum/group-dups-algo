const R = require('ramda');

function findDuplicateTransactions (transactions = []) {
    let result = [];
    const duplicatesByKeys = createGroupsByKeys(transactions);
    Object.values(duplicatesByKeys).forEach(group => {
        result = [...result, ...extractDuplicatesFromGroup(group)];
    })
    result.sort((a,b) => Date.parse(a[0].time) - Date.parse(b[0].time));
    return result;
}

function extractDuplicatesFromGroup (transactionGroup) {
    const groupsByTime = {};
    R.aperture(2, getSortedTransactions(transactionGroup)).forEach(([a, b]) => {
        const aTime = Date.parse(a.time);
        const bTime = Date.parse(b.time);

        if (bTime - aTime <= 60 * 1000) {
            if (aTime in groupsByTime) {
                addToValuesAndSwapKey(groupsByTime, aTime, bTime, b);
            } else {
                groupsByTime[bTime] = [a, b];
            }
        }
    });

    return Object.values(groupsByTime);
}

function addToValuesAndSwapKey (groupsByTime, aTime, bTime, b) {
    const groupWithA = groupsByTime[aTime];
    delete groupsByTime[aTime];
    groupWithA.push(b);
    groupsByTime[bTime] = groupWithA;
}

function createGroupsByKeys (transactions) {
    const duplicates = {};
    transactions.forEach(transaction => {
        const transactionKey = createKeyForTransaction(transaction);
        if (!(transactionKey in duplicates)) {
            duplicates[transactionKey] = [];
        }
        duplicates[transactionKey].push(transaction);
    });
    return duplicates;
}

function createKeyForTransaction (t) {
    return `${t.sourceAccount}-${t.targetAccount}-${t.amount}-${t.category}`;
}

function getSortedTransactions (transactions = []) {
    return [...transactions].sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
}


