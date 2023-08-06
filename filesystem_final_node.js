const fs = require('fs');
const figlet = require('figlet');
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

function getFileSize(filePath) {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(ROOT_DIRECTORY, filePath);
    const stats = fs.statSync(fullPath);
    return stats.size;
}

function getFilePermissionsString(file) {
    const { read, write } = file.permissions;
    return `Read: ${read ? 'Yes' : 'No'}, Write: ${write ? 'Yes' : 'No'}`;
}


function createFile(filePath, content, user) {
    if (!filePath || !content) {
        throw new Error('File path and content are required.');
    }

    const fileName = path.basename(filePath);
    let fullPath;

    console.log('1. Current Working Directory');
    console.log('2. Specify Custom Directory Path');
    const choice = prompt('Enter your choice for file path: ');

    switch (choice) {
        case '1':
            fullPath = path.join(process.cwd(), filePath); // Use the current working directory
            break;
        case '2':
            const customDir = prompt('Enter the custom directory path: ');
            fullPath = path.isAbsolute(customDir) ? customDir : path.join(process.cwd(), customDir);
            break;
        default:
            throw new Error('Invalid choice. Please try again.');
    }

    if (fileSystem[fullPath]) {
        throw new Error('File already exists. Please provide a different file name or path.');
    }

    const permissions = { read: true, write: user === 'admin' };
    fs.writeFileSync(fullPath, content, 'utf8');

    fileSystem[fullPath] = { type: 'file', user, permissions };
    saveFileSystem();
    console.log('File created successfully!');
}


function readFile(filePath, user) {
    if (!filePath) {
        throw new Error('File path is required.');
    }

    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(ROOT_DIRECTORY, filePath);

    if (!fs.existsSync(fullPath)) {
        throw new Error('File not found.');
    }

    const file = fileSystem[fullPath];
    if (!file || file.type !== 'file') {
        throw new Error('File not found in the file system data.');
    }

    if (!file.permissions.read && file.user !== user) {
        throw new Error('Permission denied. You do not have read access to this file.');
    }

    return fs.readFileSync(fullPath, 'utf8');
}



function writeFile(filePath, content, user) {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(ROOT_DIRECTORY, filePath);

    if (!fs.existsSync(fullPath)) {
        throw new Error('File not found.');
    }

    const file = fileSystem[fullPath];
    if (!file || file.type !== 'file') {
        throw new Error('File not found in the file system data.');
    }

    if (!file.permissions.write && file.user !== user) {
        throw new Error('Permission denied. You do not have write access to this file.');
    }

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('File updated successfully!');
}

function deleteFile(filePath, user) {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(ROOT_DIRECTORY, filePath);

    if (!fs.existsSync(fullPath)) {
        throw new Error('File not found.');
    }

    const file = fileSystem[fullPath];
    if (!file || file.type !== 'file') {
        throw new Error('File not found in the file system data.');
    }

    if (!file.permissions.write && file.user !== user) {
        throw new Error('Permission denied. You do not have write access to this file.');
    }

    fs.unlinkSync(fullPath);
    delete fileSystem[fullPath];
    saveFileSystem();
    console.log('File deleted successfully!');
}

function changePermission(filePath, mode, user) {
    if (!filePath || !mode) {
        throw new Error('File path and mode are required.');
    }

    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(ROOT_DIRECTORY, filePath);

    if (!fs.existsSync(fullPath)) {
        throw new Error('File not found.');
    }

    const file = fileSystem[fullPath];
    if (!file || file.type !== 'file') {
        throw new Error('File not found in the file system data.');
    }

    if (file.user !== user) {
        throw new Error('Permission denied. You do not have permission to change file permissions.');
    }

    fs.chmodSync(fullPath, mode);
    console.log('File permissions changed successfully!');
}

function createDirectory(directoryPath, user) {
    const fullPath = path.isAbsolute(directoryPath) ? directoryPath : path.join(ROOT_DIRECTORY, directoryPath);

    if (fs.existsSync(fullPath)) {
        throw new Error('Directory already exists.');
    }

    const parentDir = path.dirname(fullPath);
    if (!fs.existsSync(parentDir)) {
        throw new Error('Parent directory does not exist.');
    }

    fs.mkdirSync(fullPath);
    const permissions = { read: true, write: user === 'admin' };
    fileSystem[fullPath] = { type: 'directory', user, permissions };
    saveFileSystem();
    console.log('Directory created successfully!');
}


function deleteDirectory(directoryPath, user) {
    const fullPath = path.isAbsolute(directoryPath) ? directoryPath : path.join(ROOT_DIRECTORY, directoryPath);

    if (!fs.existsSync(fullPath)) {
        throw new Error('Directory not found.');
    }

    const dirFiles = fs.readdirSync(fullPath);
    if (dirFiles.length > 0) {
        throw new Error('Cannot delete non-empty directory.');
    }

    const directory = fileSystem[fullPath];
    if (!directory || directory.type !== 'directory') {
        throw new Error('Directory not found in the file system data.');
    }

    if (!directory.permissions.write && directory.user !== user) {
        throw new Error('Permission denied. You do not have write access to this directory.');
    }

    fs.rmdirSync(fullPath);
    delete fileSystem[fullPath];
    saveFileSystem();
    console.log('Directory deleted successfully!');
}


function listFilesInDirectory(directoryPath) {
    const fullPath = path.isAbsolute(directoryPath) ? directoryPath : path.join(ROOT_DIRECTORY, directoryPath);

    if (!fs.existsSync(fullPath)) {
        throw new Error('Directory not found.');
    }

    const files = fs.readdirSync(fullPath);
    console.log('Files in directory:');
    files.forEach((file) => console.log(file));
}


// ... (other functions for deleteFile, createDirectory, deleteDirectory, etc.)

function displayFileSystem(user) {
    console.log('--- File System ---');
    console.log('Path\t\t\t\t\t\t\t\t\t\t\tType\tSize\t\t\t\t\tLast Modified\t\t\t\t\tPermissions\t\t\t\t\tOwner');
    console.log('-----------------------------------------------------------------------');
    Object.entries(fileSystem).forEach(([filePath, file]) => {
        if (file?.permissions?.read && (file.user === user || file.permissions.write)) {
            const fullPath = path.isAbsolute(filePath) ? filePath : path.join(ROOT_DIRECTORY, filePath);
            const fileType = file.type === 'file' ? 'File' : 'Directory';
            const size = file.type === 'file' ? getFileSize(fullPath) : 'N/A';
            const lastModified = fs.statSync(fullPath).mtime;
            const permissions = getFilePermissionsString(file);
            const owner = file.user;
            console.log(`${filePath}\t${fileType}\t${size}\t${lastModified}\t${permissions}\t${owner}`);
        }
    });
    console.log('-------------------');
}


function main() {
    figlet('NIKESH', (err, data) => {
        if (err) {
            console.log('NIKESH File System');


        } else {
            console.log(data);
        }
        console.log("Nikesh Uprety | 220026")
    while (true) {
        console.log("--------------------------------")
        console.log("--------------------------------")
        console.log('1. Create File');
        console.log('2. Read File');
        console.log('3. Write File');
        console.log('4. Delete File');
        console.log('5. Create Directory');
        console.log('6. Delete Directory');
        console.log('7. List Files in Directory');
        console.log('8. Display File System');
        console.log('9. Change File Permissions');
        console.log(' . Area 51');
        console.log('51. Exit');

        const choice = prompt('Enter your choice: ');

        switch (choice) {
            case '1':
                console.log('Please provide the file path and content.');
                console.log('Example path: "files/example.txt" (This will create a file named "example.txt" in the "files" directory)');
                const createFilePath = prompt('Enter file name: ');
                const createFileContent = prompt('Enter file content: ');
                try {
                    createFile(createFilePath, createFileContent, 'admin'); // In a real app, you'd implement user authentication.
                } catch (error) {
                    console.error(error.message);
                }
                break;
            case '2':
                console.log('Please provide the file path to read.');
                console.log('Example path: "files/example.txt" (This will read "example.txt" from the "files" directory)');
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
            case '4':
                console.log('Please provide the file path to delete.');
                console.log('Example path: "files/example.txt" (This will delete "example.txt" from the "files" directory)');
                const deleteFilePath = prompt('Enter file path to delete: ');
                try {
                    deleteFile(deleteFilePath, 'admin'); // In a real app, you'd implement user authentication.
                } catch (error) {
                    console.error(error.message);
                }
                break;
            case '5':
                console.log('Please provide the directory path to create.');
                console.log('Example path: "files/newDir" (This will create a directory named "newDir" in the "files" directory)');
                const createDirPath = prompt('Enter directory path to create: ');
                try {
                    createDirectory(createDirPath, 'admin'); // In a real app, you'd implement user authentication.
                } catch (error) {
                    console.error(error.message);
                }
                break;

            case '6':
                console.log('Please provide the directory path to delete.');
                console.log('Example path: "files/newDir" (This will delete the "newDir" directory from the "files" directory)');
                const deleteDirPath = prompt('Enter directory path to delete: ');
                try {
                    deleteDirectory(deleteDirPath, 'admin'); // In a real app, you'd implement user authentication.
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
                displayFileSystem('admin'); // In a real app, you'd implement user authentication.
                break;
            
            case '9':
                console.log('Please provide the file path and new mode.');
                const changeFilePath = prompt('Enter file path: ');
                const newMode = parseInt(prompt('Enter new mode (e.g., 755): '), 8);
                try {
                    changePermission(changeFilePath, newMode, 'admin');
                } catch (error) {
                    console.error(error.message);
                }
                break;
            case 'area 51':
                console.log('You have unlocked Area 51 secrets!, HAHAHA');
                console.log("Exiting...Thank you For Using Niku's File system");
                return;

            case '51':
                saveFileSystem();
                console.log("Exiting...Thank you For Using Niku's File system");
                return;
            default:
                console.log('Invalid choice. Please try again.');
        }
    }
});
}

main();