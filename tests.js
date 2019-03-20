let assert = require("chai").assert;

function getTransaction (id, time) {
    return getTransactionWithAmountAndCategory(id, time, 100, 'eating_out')
}

function getTransactionWithAmountAndCategory (id, time, amount, category) {
    return {
        id,
        sourceAccount: 'A',
        targetAccount: 'B',
        amount,
        category,
        time
    }
}

describe('addToValuesAndSwapKey()', function() {
    it('adds transaction to an array in values of object, and changes the key', function() {
        const transactionA = getTransaction (1, '2018-03-02T10:33:00.000Z');
        const transactionB = getTransaction (2, '2018-03-02T10:33:10.000Z');
        const groupsByTime = {
            1519986870000: [ transactionA ]
        };
        addToValuesAndSwapKey(groupsByTime, 1519986870000, 1519986870010, transactionB)
        assert.deepEqual(groupsByTime, {1519986870010: [transactionA, transactionB]})
    })

    it('adds transaction to an array and changes the key when all transactions' +
        'are on the same time', function() {
        const time = 1519986870000;
        const transactionA = getTransaction(1, time);
        const transactionB = getTransaction(2, time);
        const transactionC = getTransaction(3, time);
        const groupsByTime = {
            1519986870000: [ transactionA, transactionB ]
        };
        addToValuesAndSwapKey(groupsByTime, time, time, transactionC)
        assert.deepEqual(groupsByTime, {1519986870000: [transactionA, transactionB, transactionC]})
    })
})

describe('extractDuplicatesFromGroup()', function() {
    it('returns list of duplicate transactions by time from a group with the same key', function() {
        const group = [
            getTransaction(1, '2018-03-02T10:33:00.000Z'),
            getTransaction(2, '2018-03-02T10:33:50.000Z'),
        ];
        assert.deepEqual(extractDuplicatesFromGroup(group), [group]);
    })

    it('returns [] from a group with the same key but time gap > 1 minute', function() {
        const group = [
            getTransaction(1, '2018-03-02T10:33:00.000Z'),
            getTransaction(2, '2018-03-02T10:35:50.000Z'),
        ];
        assert.deepEqual(extractDuplicatesFromGroup(group), []);
    })
})

describe('createGroupsByKeys()', function() {
    it('returns group from two similar transactions, regardless of time', function() {
        const transactions = [
            getTransaction(1, '2018-03-02T10:33:00.000Z'),
            getTransaction(2, '2018-03-02T10:33:50.000Z'),
        ];
        const expectedGroup = { 'A-B-100-eating_out': transactions }
        assert.deepEqual(createGroupsByKeys(transactions), expectedGroup);
    });
})

describe('createKeyForTransaction()', function() {
    it('returns key for transaction', function() {
        const transaction = getTransaction(1, '2018-03-02T10:33:00.000Z');
        assert(createKeyForTransaction(transaction) === 'A-B-100-eating_out');
    });
})

describe('getSortedTransactions()', function() {
    it('returns sorted transactions by time', function() {
        const sorted = getSortedTransactions([
            { time: '2018-03-02T10:34:30.000Z' },
            { time: '2018-03-02T10:33:00.000Z' }
        ]);
        assert.deepEqual(sorted, [
            { time: '2018-03-02T10:33:00.000Z' },
            { time: '2018-03-02T10:34:30.000Z' }
        ])
    });
})

describe('findDuplicateTransactions()', function() {
    it('returns empty array if there are no transactions', function() {
        assert.deepEqual(findDuplicateTransactions([]), []);
    });

    it('returns empty array if there are no duplicates', function() {
        const input = [
            getTransactionWithAmountAndCategory(1, '2018-03-02T10:34:30.000Z', 90, 'eating_out'),
            getTransactionWithAmountAndCategory(2, '2018-03-02T10:33:00.000Z', 100, 'eating_out')
        ];
        assert.deepEqual(findDuplicateTransactions(input), []);
    });

    it('returns one group of duplicates, doesn\'t insert non duplicate', function() {
        const dups = [
            getTransaction(1, '2018-03-02T10:33:00.000Z'),
            getTransaction(2, '2018-03-02T10:33:50.000Z')
        ];
        const input = [
            ...dups,
            getTransactionWithAmountAndCategory(3, '2018-03-02T10:33:00.000Z', 100, 'groceries')
        ];
        assert.deepEqual(findDuplicateTransactions(input), [dups]);
    });

    it('returns two different groups of duplicates, sorted', function() {
        const dups1 = [
            getTransaction(1, '2018-03-02T10:33:00.000Z'),
            getTransaction(2, '2018-03-02T10:33:50.000Z')
        ];
        const dups2 = [
            getTransactionWithAmountAndCategory(3, '2018-03-01T10:34:30.000Z', 90, 'groceries'),
            getTransactionWithAmountAndCategory(4, '2018-03-01T10:34:40.000Z', 90, 'groceries')
        ];
        assert.deepEqual(findDuplicateTransactions([...dups1, ...dups2]), [dups2, dups1]);
    });

    it('returns a group of duplicates with non duplicate in the middle', function() {
        const transactionA = getTransaction(1, '2018-03-02T10:33:00.000Z');
        const transactionB = getTransaction(3, '2018-03-02T10:34:00.000Z');
        const input = [
            transactionA,
            getTransaction(2, '2018-03-02T10:36:00.000Z'),
            transactionB
        ];
        assert.deepEqual(findDuplicateTransactions(input), [[transactionA, transactionB]]);
    });

    it('returns a group of duplicates if all transactions have the same time', function() {
        const time = '2018-03-02T10:33:00.000Z';
        const transactionA = getTransaction(1, time);
        const transactionB = getTransaction(2, time);
        const transactionC = getTransaction(3, time);
        assert.deepEqual(findDuplicateTransactions([transactionA, transactionB, transactionC]),
            [[transactionA, transactionB, transactionC]]);
    });

});
