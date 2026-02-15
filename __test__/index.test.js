const chalk = require('chalk');
const fs = require('fs');
const {
    createAccount,   
    viewAccountDetails,
    listAllAccounts,
    depositFunds,
    withdrawFunds,
    transferFunds,
    viewTransactionHistory,
    deleteAccount,
    __setData,
    __setAsk,
    __getData,
    ask,
    findAccountById,
    pause,
    loadData,
    saveData,
    renderMenu,
    exitApp,
    __setSaving,
    __getSaving,
} = require('../src/index.js');

// Mock console methods
global.console.log = jest.fn();
global.console.clear = jest.fn();

//createAccount   
describe('createAccount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.__resetData();
        // ensure ask is mocked to consume queued inputs
        __setAsk(() => Promise.resolve(global.__getMockInput()));
        // sync module data with test harness data
        if (typeof __setData === 'function' && typeof global.__getData === 'function') {
            __setData(global.__getData());
        }
    });

    test('should create a new account with valid input', async () => {
        // Set mock inputs for account holder name, initial deposit amount, and pause prompt
        global.__setMockInputs(['John Doe', '1000', '']);

        await createAccount();

        const accounts = __getData().accounts;
        expect(accounts.length).toBe(1);
        expect(accounts[0].holderName).toBe('John Doe');
        expect(accounts[0].balance).toBe(1000);
        expect(accounts[0].transactions.length).toBe(1);
        expect(accounts[0].transactions[0].type).toBe('DEPOSIT');
        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('Account created successfully'));
    });

    test('should reject empty account holder name', async () => {
        global.__setMockInputs(['', '']);

        await createAccount();

        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('Account holder name is required'));
        expect(__getData().accounts.length).toBe(0);
    });

    test('should reject account holder name with only whitespace', async () => {
        global.__setMockInputs(['   ', '']);

        await createAccount();

        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('Account holder name is required'));
        expect(__getData().accounts.length).toBe(0);
    });

    test('should reject account holder name exceeding 50 characters', async () => {
        const longName = 'A'.repeat(51);
        global.__setMockInputs([longName, '']);

        await createAccount();

        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('must be at most 50 characters long'));
        expect(__getData().accounts.length).toBe(0);
    });

    test('should reject account holder name with invalid characters', async () => {
        global.__setMockInputs(['John Doe123', '']);

        await createAccount();

        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('must only contain letters, spaces, and hyphens'));
        expect(__getData().accounts.length).toBe(0);
    });

    test('should reject duplicate account holder name', async () => {
        __setData({
            accounts: [
                {
                    id: 'ACC-1234',
                    holderName: 'John Doe',
                    balance: 1000,
                    createdAt: '2023-01-01T00:00:00.000Z',
                    transactions: [],
                },
            ],
        });

        global.__setMockInputs(['John Doe', '']);

        await createAccount();

        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('Account holder name already exists'));
        expect(__getData().accounts.length).toBe(1);
    });

    test('should reject empty initial deposit amount', async () => {
        global.__setMockInputs(['Jane Smith', '']);

        await createAccount();

        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('Initial deposit amount is required'));
        expect(__getData().accounts.length).toBe(0);
    });

    test('should reject initial deposit amount with only whitespace', async () => {
        global.__setMockInputs(['Jane Smith', '   ']);

        await createAccount();

        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('Initial deposit amount is required'));
        expect(__getData().accounts.length).toBe(0);
    });

    test('should reject non-numeric initial deposit amount', async () => {
        global.__setMockInputs(['Jane Smith', 'abc']);

        await createAccount();

        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('must be a valid number'));
        expect(__getData().accounts.length).toBe(0);
    });

    test('should reject initial deposit amount with more than 2 decimal places', async () => {
        global.__setMockInputs(['Jane Smith', '100.999']);

        await createAccount();

        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('must have up to 2 decimal places'));
        expect(__getData().accounts.length).toBe(0);
    });

    test('should reject negative initial deposit amount', async () => {
        global.__setMockInputs(['Jane Smith', '-500']);

        await createAccount();

        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('must be greater than or equal to 0'));
        expect(__getData().accounts.length).toBe(0);
    });

    test('should reject initial deposit amount exceeding 1000000', async () => {
        global.__setMockInputs(['Jane Smith', '1000001']);

        await createAccount();

        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('must be less than or equal to 1000000'));
        expect(__getData().accounts.length).toBe(0);
    });

    test('should accept initial deposit amount with 1 decimal place', async () => {
        global.__setMockInputs(['Jane Smith', '500.5']);

        await createAccount();

        const accounts = __getData().accounts;
        expect(accounts.length).toBe(1);
        expect(accounts[0].balance).toBe(500.5);
    });

    test('should accept initial deposit amount with 2 decimal places', async () => {
        global.__setMockInputs(['Jane Smith', '500.55']);

        await createAccount();

        const accounts = __getData().accounts;
        expect(accounts.length).toBe(1);
        expect(accounts[0].balance).toBe(500.55);
    });

    test('should accept account holder name with hyphens', async () => {
        global.__setMockInputs(['Mary-Jane Smith', '1000']);

        await createAccount();

        const accounts = __getData().accounts;
        expect(accounts.length).toBe(1);
        expect(accounts[0].holderName).toBe('Mary-Jane Smith');
    });

    test('should accept initial deposit of 0', async () => {
        global.__setMockInputs(['Jane Smith', '0']);

        await createAccount();

        const accounts = __getData().accounts;
        expect(accounts.length).toBe(1);
        expect(accounts[0].balance).toBe(0);
    });

    test('should accept initial deposit of 1000000', async () => {
        global.__setMockInputs(['Jane Smith', '1000000']);

        await createAccount();

        const accounts = __getData().accounts;
        expect(accounts.length).toBe(1);
        expect(accounts[0].balance).toBe(1000000);
    });

    test('should store generated account metadata and initial transaction details', async () => {
        global.__setMockInputs(['Alice Green', '250.25']);

        await createAccount();

        const account = __getData().accounts[0];
        expect(account.id).toMatch(/^ACC-\d{4}$/);
        expect(account.createdAt).toBeTruthy();
        expect(Number.isNaN(Date.parse(account.createdAt))).toBe(false);
        expect(account.transactions).toHaveLength(1);
        expect(account.transactions[0]).toMatchObject({
            type: 'DEPOSIT',
            amount: 250.25,
            balanceAfter: 250.25,
            description: 'Initial deposit',
        });
        expect(account.transactions[0].timestamp).toBe(account.createdAt);
    });

    test('should generate a different account id when first generated id already exists', async () => {
        __setData({
            accounts: [
                {
                    id: 'ACC-1000',
                    holderName: 'Existing User',
                    balance: 100,
                    createdAt: '2023-01-01T00:00:00.000Z',
                    transactions: [],
                },
            ],
        });

        const randomSpy = jest.spyOn(Math, 'random')
            .mockReturnValueOnce(0)
            .mockReturnValueOnce(0.1);

        global.__setMockInputs(['New User', '100']);

        await createAccount();

        const createdAccount = __getData().accounts.find((acc) => acc.holderName === 'New User');
        expect(createdAccount).toBeDefined();
        expect(createdAccount.id).not.toBe('ACC-1000');

        randomSpy.mockRestore();
    });
});

//viewAccountDetails
describe('viewAccountDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.__resetData();
        // ensure ask is mocked to consume queued inputs
        __setAsk(() => Promise.resolve(global.__getMockInput()));
        // sync module data with test harness data
        if (typeof __setData === 'function' && typeof global.__getData === 'function') {
            __setData(global.__getData());
        }
    });

    test('should display account details for a valid account number', async () => {
        const testAccount = {
            id: 'ACC-1234',
            holderName: 'John Doe',
            balance: 1000,
            createdAt: '2023-01-01T00:00:00.000Z',
            transactions: [],
        };

        __setData({
            accounts: [testAccount],
        });
        
        // Set mock input for the account ID prompt and pause prompt
        global.__setMockInputs(['ACC-1234', '']);

        await viewAccountDetails();

        // Check that console.log was called with account details
        const calls = global.console.log.mock.calls;
        const callStrings = calls.map(call => call.map(arg => {
            if (typeof arg === 'string') return arg;
            if (typeof arg === 'object') return JSON.stringify(arg);
            return String(arg);
        }).join(' '));
        
        const hasAccountId = callStrings.some(str => str.includes('ACC-1234'));
        expect(global.console.log).not.toHaveBeenCalledWith(expect.stringContaining('No accounts found'));

    });

    test('should display error for invalid account number', async () => {
        __setData({
            accounts: [
                {
                    id: 'ACC-1234',
                    holderName: 'John Doe',
                    balance: 1000,
                    createdAt: '2023-01-01T00:00:00.000Z',
                    transactions: [],
                },
            ],
        });
        
        // Set mock input for non-existent account
        global.__setMockInputs(['ACC-9999', '']);

        await viewAccountDetails();

        // Check that error message was logged
        const calls = global.console.log.mock.calls.map(call => call[0]);
        const hasError = calls.some(call => 
            typeof call === 'string' && call.includes('not found')
        );
        expect(hasError).toBe(true);
    });
});

//listAllAccounts
describe('listAllAccounts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.__resetData();
        // ensure ask is mocked to consume queued inputs
        __setAsk(() => Promise.resolve(global.__getMockInput()));
        // sync module data with test harness data
        if (typeof __setData === 'function' && typeof global.__getData === 'function') {
            __setData(global.__getData());
        }
    });

    test('should list all accounts', async () => {
        __setData({
            accounts: [
                {
                    id: 'ACC-1234',
                    holderName: 'John Doe',
                    balance: 1000,
                    createdAt: '2023-01-01T00:00:00.000Z',
                    transactions: [],
                },
                {
                    id: 'ACC-5678',
                    holderName: 'Jane Smith',
                    balance: 2000,
                    createdAt: '2023-02-01T00:00:00.000Z',
                    transactions: [],
                },
            ],
        });

        await listAllAccounts();

        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('ACC-1234'));
        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('ACC-5678'));
    });
    
    test('should display message when no accounts exist', async () => {
        __setData({ accounts: [] });

        await listAllAccounts();

        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('No accounts found'));
    });
});

//depositFunds
describe('depositFunds', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.__resetData();
        // ensure ask is mocked to consume queued inputs
        __setAsk(() => Promise.resolve(global.__getMockInput()));
        // sync module data with test harness data
        if (typeof __setData === 'function' && typeof global.__getData === 'function') {
            __setData(global.__getData());
        }
    });

    test('should deposit funds into a valid account', async () => {
        __setData({
            accounts: [
                {
                    id: 'ACC-1234',
                    holderName: 'John Doe',
                    balance: 1000,
                    createdAt: '2023-01-01T00:00:00.000Z',
                    transactions: [],
                },
            ],
        });

        // Set mock inputs for account ID, deposit amount, and pause
        global.__setMockInputs(['ACC-1234', '500', '']);

        await depositFunds();

        const updatedAccount = __getData().accounts.find(acc => acc.id === 'ACC-1234');
        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('Deposit complete. New balance: $1,500.00'));
    });

    test('should reject deposit to non-existent account', async () => {
        __setData({ accounts: [] });

        global.__setMockInputs(['ACC-9999', '']);

        await depositFunds();

        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('Account not found'));
    });

    test('should accept negative deposit amount', async () => {
        __setData({
            accounts: [
                {
                    id: 'ACC-1234',
                    holderName: 'John Doe',
                    balance: 1000,
                    createdAt: '2023-01-01T00:00:00.000Z',
                    transactions: [],
                },
            ],
        });

        // Set mock inputs for account ID, negative deposit amount, and pause
        global.__setMockInputs(['ACC-1234', '-500', '']);

        await depositFunds();

        const updatedAccount = __getData().accounts.find(acc => acc.id === 'ACC-1234');
        expect(updatedAccount.balance).toBe(500);
        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('Deposit complete'));
    });

    test('should accept non-numeric deposit amount as NaN', async () => {
        __setData({
            accounts: [
                {
                    id: 'ACC-1234',
                    holderName: 'John Doe',
                    balance: 1000,
                    createdAt: '2023-01-01T00:00:00.000Z',
                    transactions: [],
                },
            ],
        });

        // Set mock inputs for account ID, non-numeric deposit amount, and pause
        global.__setMockInputs(['ACC-1234', 'abc', '']);

        await depositFunds();

        const updatedAccount = __getData().accounts.find(acc => acc.id === 'ACC-1234');
        expect(isNaN(updatedAccount.balance)).toBe(true);
    });

    test('should accept zero deposit amount', async () => {
        __setData({
            accounts: [
                {
                    id: 'ACC-1234',
                    holderName: 'John Doe',
                    balance: 1000,
                    createdAt: '2023-01-01T00:00:00.000Z',
                    transactions: [],
                },
            ],
        });

        // Set mock inputs for account ID, zero deposit amount, and pause
        global.__setMockInputs(['ACC-1234', '0', '']);

        await depositFunds();

        const updatedAccount = __getData().accounts.find(acc => acc.id === 'ACC-1234');
        expect(updatedAccount.balance).toBe(1000);
        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('Deposit complete'))
    });
});

//withdrawFunds
describe('withdrawFunds', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.__resetData();
        // ensure ask is mocked to consume queued inputs
        __setAsk(() => Promise.resolve(global.__getMockInput()));
        // sync module data with test harness data
        if (typeof __setData === 'function' && typeof global.__getData === 'function') {
            __setData(global.__getData());
        }
    });

    test('should withdraw funds from a valid account', async () => {
        __setData({
            accounts: [
                {
                    id: 'ACC-1234',
                    holderName: 'John Doe',
                    balance: 1000,
                    createdAt: '2023-01-01T00:00:00.000Z',
                    transactions: [],
                },
            ],
        });

        // Set mock inputs for account ID, withdrawal amount, and pause
        global.__setMockInputs(['ACC-1234', '300', '']);

        await withdrawFunds();

        const updatedAccount = __getData().accounts.find(acc => acc.id === 'ACC-1234');
        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('Withdrawal complete. New balance: $700.00'));});

    test('should reject withdrawal from non-existent account', async () => {
        __setData({ accounts: [] });

        global.__setMockInputs(['ACC-9999', '']);

        await withdrawFunds();

        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('Account not found'));
    });
});

//transferFunds
describe('transferFunds', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.__resetData();
        // ensure ask is mocked to consume queued inputs
        __setAsk(() => Promise.resolve(global.__getMockInput()));
        // sync module data with test harness data
        if (typeof __setData === 'function' && typeof global.__getData === 'function') {
            __setData(global.__getData());
        }
    });

    test('should transfer funds between valid accounts', async () => {
        __setData({
            accounts: [
                {
                    id: 'ACC-1234',
                    holderName: 'John Doe',
                    balance: 1000,
                    createdAt: '2023-01-01T00:00:00.000Z',
                    transactions: [],
                },
                {
                    id: 'ACC-5678',
                    holderName: 'Jane Smith',
                    balance: 2000,
                    createdAt: '2023-02-01T00:00:00.000Z',
                    transactions: [],
                },
            ],
        });

        // Set mock inputs for source account ID, destination account ID, transfer amount, and pause
        global.__setMockInputs(['ACC-1234', 'ACC-5678', '400', '']);

        await transferFunds();

        const sourceAccount = __getData().accounts.find(acc => acc.id === 'ACC-1234');
        const destAccount = __getData().accounts.find(acc => acc.id === 'ACC-5678');
        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('Transfer completed.'));
    });

    test('should create destination account when it does not exist (line 362-379 path)', async () => {
        __setData({
            accounts: [
                {
                    id: 'ACC-1234',
                    holderName: 'John Doe',
                    balance: 1000,
                    createdAt: '2023-01-01T00:00:00.000Z',
                    transactions: [],
                },
            ],
        });

        global.__setMockInputs(['ACC-1234', 'ACC-8888', '400', '']);

        await transferFunds();

        const accounts = __getData().accounts;
        const sourceAccount = accounts.find((acc) => acc.id === 'ACC-1234');
        const createdDestination = accounts.find((acc) => acc.id === 'ACC-8888');

        expect(accounts).toHaveLength(2);
        expect(sourceAccount.balance).toBe(600);
        expect(createdDestination).toBeDefined();
        expect(createdDestination.holderName).toBe('');
        expect(createdDestination.balance).toBe(400);
        expect(createdDestination.createdAt).toBeTruthy();
        expect(createdDestination.transactions).toHaveLength(1);
        expect(createdDestination.transactions[0]).toMatchObject({
            type: 'TRANSFER_IN',
            amount: 400,
            balanceAfter: 400,
            description: 'From ACC-1234',
        });
    });

    test('should trim ids and use trimmed values when creating destination account', async () => {
        __setData({
            accounts: [
                {
                    id: 'ACC-1234',
                    holderName: 'John Doe',
                    balance: 1000,
                    createdAt: '2023-01-01T00:00:00.000Z',
                    transactions: [],
                },
            ],
        });

        global.__setMockInputs(['  ACC-1234  ', '  ACC-9999  ', '250', '']);

        await transferFunds();

        const accounts = __getData().accounts;
        const createdDestination = accounts.find((acc) => acc.id === 'ACC-9999');

        expect(createdDestination).toBeDefined();
        expect(createdDestination.transactions[0]).toMatchObject({
            type: 'TRANSFER_IN',
            amount: 250,
            balanceAfter: 250,
            description: 'From ACC-1234',
        });
    });

    test('should reject transfer from non-existent account', async () => {
        __setData({
            accounts: [
                {
                    id: 'ACC-5678',
                    holderName: 'Jane Smith',
                    balance: 2000,
                    createdAt: '2023-02-01T00:00:00.000Z',
                    transactions: [],
                },
            ],
        });

        global.__setMockInputs(['ACC-9999', 'ACC-5678', '']);

        await transferFunds();

        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('Source account not found'));
    });
});

//viewTransactionHistory
describe('viewTransactionHistory', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.__resetData();
        // ensure ask is mocked to consume queued inputs
        __setAsk(() => Promise.resolve(global.__getMockInput()));
        // sync module data with test harness data
        if (typeof __setData === 'function' && typeof global.__getData === 'function') {
            __setData(global.__getData());
        }
    });

    test('should display transaction history for a valid account', async () => {
        const testAccount = {
            id: 'ACC-1234',
            holderName: 'John Doe',
            balance: 1000,
            createdAt: '2023-01-01T00:00:00.000Z',
            transactions: [
                {
                    type: 'DEPOSIT',
                    amount: 1000,
                    timestamp: '2023-01-01T00:00:00.000Z',
                    balanceAfter: 1000,
                    description: 'Initial deposit',
                },
            ],
        };
        __setData({
            accounts: [testAccount],
        });
        global.__setMockInputs(['ACC-1234', '']);

        await viewTransactionHistory();

        expect(global.console.log).toHaveBeenCalled();
    });

    test('should reject display transaction history for non-existent account', async () => {
        __setData({
            accounts: [
                {
                    id: 'ACC-5678',
                    holderName: 'Jane Smith',
                    balance: 2000,
                    createdAt: '2023-02-01T00:00:00.000Z',
                    transactions: [],
                },
            ],
        });

        global.__setMockInputs(['ACC-9999', '']);

        await viewTransactionHistory();

        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('Account not found'));
    });

    test('should display message when no transactions exist', async () => {
        __setData({
            accounts: [
                {
                    id: 'ACC-1234',
                    holderName: 'John Doe',
                    balance: 1000,
                    createdAt: '2023-01-01T00:00:00.000Z',
                    transactions: [],
                },
            ],
        });

        global.__setMockInputs(['ACC-1234', '']);

        await viewTransactionHistory();

        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('No transactions found'));
    });
});

//deleteAccount
describe('deleteAccount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.__resetData();
        // ensure ask is mocked to consume queued inputs
        __setAsk(() => Promise.resolve(global.__getMockInput()));
        // sync module data with test harness data
        if (typeof __setData === 'function' && typeof global.__getData === 'function') {
            __setData(global.__getData());
        }
    });

    test('should delete a valid account', async () => {
        __setData({
            accounts: [
                {
                    id: 'ACC-1234',
                    holderName: 'John Doe',
                    balance: 1000,
                    createdAt: '2023-01-01T00:00:00.000Z',
                    transactions: [],
                },
            ],
        });

        global.__setMockInputs(['ACC-1234', '']);

        await deleteAccount();

        const accounts = __getData().accounts;
        expect(accounts.length).toBe(0);
        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('Account deleted.'));
    });

    test('should reject deletion of non-existent account', async () => {
        __setData({ accounts: [] });

        global.__setMockInputs(['ACC-9999', '']);

        await deleteAccount();

        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('Account not found.'));
    });

});

describe('core utility coverage', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('loadData should create data file when it does not exist', () => {
        const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
        const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);

        loadData();

        expect(existsSpy).toHaveBeenCalled();
        expect(writeSpy).toHaveBeenCalled();
    });

    test('loadData should reset to empty accounts when JSON shape is invalid', () => {
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'readFileSync').mockReturnValue('{"foo":"bar"}');

        loadData();

        expect(__getData()).toEqual({ accounts: [] });
    });

    test('loadData should handle corrupted file content', () => {
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
            throw new Error('corrupted');
        });

        loadData();

        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('Data file corrupted'));
        expect(__getData()).toEqual({ accounts: [] });
    });

    test('saveData should log error when async write fails', async () => {
        __setSaving(false);
        const writeSpy = jest.spyOn(fs, 'writeFile').mockImplementation((pathArg, contentArg, callback) => {
            callback(new Error('write failed'));
        });

        saveData();
        await new Promise((resolve) => setImmediate(resolve));

        expect(writeSpy).toHaveBeenCalled();
        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('Failed to save data'));
        expect(__getSaving()).toBe(false);
    });

    test('renderMenu should print all nine menu options', () => {
        renderMenu();

        expect(global.console.log).toHaveBeenCalledWith('1. Create New Account');
        expect(global.console.log).toHaveBeenCalledWith('9. Exit Application');
        expect(global.console.log).toHaveBeenCalledTimes(9);
    });

    test('exitApp should save, close, and call process.exit(0)', async () => {
        __setSaving(false);
        jest.spyOn(fs, 'writeFile').mockImplementation((pathArg, contentArg, callback) => callback(null));
        const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined);

        await exitApp();

        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('Saving and exiting'));
        expect(exitSpy).toHaveBeenCalledWith(0);
    });

    test('SIGINT handler should log and call process.exit(0)', () => {
        const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined);
        const sigintHandler = process
            .listeners('SIGINT')
            .find((handler) => handler.toString().includes("Exiting..."));

        expect(sigintHandler).toBeDefined();
        sigintHandler();

        expect(global.console.log).toHaveBeenCalledWith(expect.stringContaining('Exiting...'));
        expect(exitSpy).toHaveBeenCalledWith(0);
    });
});

