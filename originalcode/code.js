const fs = require('fs');
const path = require('path');
const prompt = require('prompt-sync')();

const FILE_SYSTEM_DB = 'filesystem.json';
const ROOT_DIRECTORY = path.join(__dirname, 'filesystem');

// Initialize the file system or load existing data from the JSON file
let fileSystem = {};
if (fs.existsSync(FILE_SYSTEM_DB)) {
    const data = fs.readFileSync(FILE_SYSTEM_DB, 'utf8');
    fileSystem = JSON.parse(data);
}

function saveFileSystem() {
    fs.writeFileSync(FILE_SYSTEM_DB, JSON.stringify(fileSystem), 'utf8');
}

function createFile(filePath, content, user) {
    if (fileSystem[filePath]) {
        throw new Error('File already exists.');
    }

    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
        throw new Error('Directory does not exist.');
    }

    const permissions = { read: true, write: user === 'admin' };
    const fullPath = path.join(ROOT_DIRECTORY, filePath);
    fs.writeFileSync(fullPath, content, 'utf8');

    fileSystem[filePath] = { type: 'file', user, permissions };
    saveFileSystem();
    console.log('File created successfully!');
}

function readFile(filePath, user) {
    const file = fileSystem[filePath];
    if (!file || file.type !== 'file') {
        throw new Error('File not found.');
    }
    if (!file.permissions.read && file.user !== user) {
        throw new Error('Permission denied. You do not have read access to this file.');
    }
    const fullPath = path.join(ROOT_DIRECTORY, filePath);
    return fs.readFileSync(fullPath, 'utf8');
}

function writeFile(filePath, content, user) {
    const file = fileSystem[filePath];
    if (!file || file.type !== 'file') {
        throw new Error('File not found.');
    }
    if (!file.permissions.write && file.user !== user) {
        throw new Error('Permission denied. You do not have write access to this file.');
    }
    const fullPath = path.join(ROOT_DIRECTORY, filePath);
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('File updated successfully!');
}

function listFilesInDirectory(directoryPath) {
    const fullPath = path.join(ROOT_DIRECTORY, directoryPath);
    const files = fs.readdirSync(fullPath);
    console.log('Files in directory:');
    files.forEach((file) => console.log(file));
}

// ... (other functions for deleteFile, createDirectory, deleteDirectory, etc.)

function displayFileSystem(user) {
    console.log('--- File System ---');
    const filteredFileSystem = Object.entries(fileSystem).reduce((acc, [path, file]) => {
        if (file.permissions.read && (file.user === user || file.permissions.write)) {
            acc[path] = file;
        }
        return acc;
    }, {});
    console.log(filteredFileSystem);
    console.log('-------------------');
}

function main() {
    while (true) {
        console.log('1. Create File');
        console.log('2. Read File');
        console.log('3. Write File');
        console.log('4. Delete File');
        console.log('5. Create Directory');
        console.log('6. Delete Directory');
        console.log('7. List Files in Directory');
        console.log('8. Display File System');
        console.log('9. Exit');

        const choice = prompt('Enter your choice: ');

        switch (choice) {
            case '1':
                const createFilePath = prompt('Enter file path: ');
                const createFileContent = prompt('Enter file content: ');
                createFile(createFilePath, createFileContent, 'admin'); // In a real app, you'd implement user authentication.
                break;
            case '2':
                const readFilePath = prompt('Enter file path to read: ');
                try {
                    const content = readFile(readFilePath, 'regular'); // In a real app, you'd implement user authentication.
                    console.log('File content:');
                    console.log(content);
                } catch (error) {
                    console.error(error.message);
                }
                break;
            case '3':
                const writeFilePath = prompt('Enter file path to write: ');
                const writeFileContent = prompt('Enter new file content: ');
                try {
                    writeFile(writeFilePath, writeFileContent, 'admin'); // In a real app, you'd implement user authentication.
                } catch (error) {
                    console.error(error.message);
                }
                break;
            case '7':
                const listDirectoryPath = prompt('Enter directory path to list files: ');
                try {
                    listFilesInDirectory(listDirectoryPath);
                } catch (error) {
                    console.error(error.message);
                }
                break;
            // ... (other cases for deleteFile, createDirectory, deleteDirectory, etc.)
            case '8':
                displayFileSystem('regular'); // In a real app, you'd implement user authentication.
                break;
            case '9':
                saveFileSystem();
                console.log('Exiting...');
                return;
            default:
                console.log('Invalid choice. Please try again.');
        }
    }
}

// Create the root directory if it doesn't exist
if (!fs.existsSync(ROOT_DIRECTORY)) {
    fs.mkdirSync(ROOT_DIRECTORY);
}

main();
