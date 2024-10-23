#!/usr/bin/env node

import { argv } from 'node:process';
import { validCommandsSet, validListCommands } from './model.js';
import fs from 'fs';

const readInputFromCLI = (input) => {
    if (!input.length || input.length < 3) {
        console.error('Please enter a valid command to work with you tasks.');
    }

    validateCommand(input[2], validCommandsSet);

    switch (input[2]) {
        case 'add':
            addTask(input);
            break;
        case 'update':
            updateTask(input);
            break;
        case 'delete':
            deleteTask(input);
            break;
        case 'mark-in-progress':
            markTaskInProgress(input);
            break;
        case 'mark-done':
            markTaskDone(input);
            break;
        case 'list':
            listTasks(input);
            break;
        default:
            console.error('Unknown command.');
            process.exit(1);
    }
};

const addTask = (input) => {
    const fileName = 'tasks.json';
    const taskName = input[3];

    validateTaskName(taskName);

    fs.access(fileName, fs.constants.F_OK, (err) => {
        if (err) {
            fs.writeFileSync(fileName, '[]', 'utf8', (err) => {
                if (err) {
                    console.error('Something wrong happened. Please try again.');
                    return;
                }
            });

            const tasks = getTasks(fileName);

            const taskToAdd = {
                description: taskName,
                status: 'todo',
                createdAt: new Date(),
                updatedAt: ''
            };

            if (!tasks.length)  {
                taskToAdd['id'] = 1;
            } else {
                taskToAdd['id'] = tasks.length + 1;
            }

            tasks.push(taskToAdd);

            postTasks(fileName, tasks, 'added');

        } else {
            readAndAppendData(taskName);
        }
    });
};

const updateTask = (input) => {
    const taskId = parseInt(input[3]);
    const taskName = input[4];

    validateTaskId(taskId);
    validateTaskName(taskName);

    const fileName = 'tasks.json';
    const tasks = getTasks(fileName);
    const taskIdx = tasks.findIndex(task => task.id === taskId);
    const task = tasks.find(task => task.id === taskId);

    if (taskIdx !== -1) {
        task['description'] = taskName;
        task['updatedAt'] = new Date();
        tasks.splice(taskIdx, 1, task);
    } else {
        throw new Error(`The task you are trying to update is not found. Have you created it?`);
    }

    postTasks(fileName, tasks, 'updated');
};

const deleteTask = (input) => {
    const taskId = parseInt(input[3]);

    validateTaskId(taskId);

    const fileName = 'tasks.json';
    const tasks = getTasks(fileName);
    const taskIdx = tasks.findIndex(task => task.id === taskId);

    if (taskIdx !== -1) {
        tasks.splice(taskIdx, 1);
    } else {
        throw new Error(`The task you are trying to delete is not found. Have you created it?`);
    }

    postTasks(fileName, tasks, 'deleted');
};

const markTaskInProgress = (input) => {
    const taskId = parseInt(input[3]);

    validateTaskId(taskId);

    const fileName = 'tasks.json';
    const tasks = getTasks(fileName);
    const taskIdx = tasks.findIndex(task => task.id === taskId);
    const task = tasks.find(task => task.id === taskId);

    if (taskIdx !== -1) {
        task['status'] = 'in-progress';
        task['updatedAt'] = new Date();
        tasks.splice(taskIdx, 1, task);
    } else {
        throw new Error(`The task you are trying to update is not found. Have you created it?`);
    }

    postTasks(fileName, tasks, 'marked in-progress');
};

const markTaskDone = (input) => {
    const taskId = parseInt(input[3]);

    validateTaskId(taskId);

    const fileName = 'tasks.json';
    const tasks = getTasks(fileName);
    const taskIdx = tasks.findIndex(task => task.id === taskId);
    const task = tasks.find(task => task.id === taskId);

    if (taskIdx !== -1) {
        task['status'] = 'done';
        task['updatedAt'] = new Date();
        tasks.splice(taskIdx, 1, task);
    } else {
        throw new Error(`The task you are trying to update is not found. Have you created it?`);
    }

    postTasks(fileName, tasks, 'marked done');
};

const listTasks = (input) => {
    const taskStatus = input[3];

    if (taskStatus) {
        validateCommand(taskStatus, validListCommands);
    }

    const fileName = 'tasks.json';
    let tasks = getTasks(fileName);

    if (!tasks.length) {
        console.log('There are no taks in your list. Please add them.');
        process.exit(1);
    }

    if (!taskStatus) {
        console.log(tasks);
    } else {
        console.log(tasks.filter(task => task.status === taskStatus));
    }
};

const readAndAppendData = (taskName) => {
    fs.readFile('tasks.json', 'utf8', (err, fileData) => {
        if (err) {
            console.error('Something wrong happened. Please try again.');
            return;
        }

        let tasks;
        try {
            tasks = JSON.parse(fileData);
        } catch (parseErr) {
            console.error('Something wrong happened', parseErr);
            return;
        }

        const task = {
            id: tasks.length + 1,
            description: taskName,
            status: 'todo',
            createdAt: new Date(),
            updatedAt: ''
        };

        tasks.push(task);

        fs.writeFile('tasks.json', JSON.stringify(tasks), 'utf8', (err) => {
            if (err) {
                console.error('There is a problem adding you task at the moment. Can you try again?');
                return;
            }

            console.error('Your task has been added.');
        })
    });
};

const getTasks = (fileName) => {
    try {
        const tasks = fs.readFileSync(fileName, 'utf8');
        return JSON.parse(tasks);
    } catch (err) {
        if (err.code == 'ENOENT') {
            throw new Error(`File not found: ${fileName}`);
        }
        throw new Error(`Error getting tasks: ${err.message}`);
    }
};

const postTasks = (fileName, tasks, action = '') => {
    try {
        fs.writeFile(fileName, JSON.stringify(tasks), 'utf8', (err) => {
            if (err) {
                return `Unable to ${action} your task. Please try again`;
            }

            console.info(`Your task is ${action} successfully`);
        });
    } catch (err) {
        throw new Error(`Something wrong happened: ${err}`);
    }
}

const validateCommand = (command, commandList) => {
    if (!commandList.has(command)) {
        console.error(`Invalid command: ${command} provided`);
        process.exit(1);
    }
};

const validateTaskName = (name) => {
    if (typeof name !== 'string' || !name.length) {
        console.error('The task name should be a string and cannot be empty');
        process.exit(1);
    }
};

const validateTaskId = (id) => {
    if (typeof id !== 'number' || !id || id <= 0) {
        console.error('Entered task not found. Please enter a valid task id.');
        process.exit(1);
    }
};

readInputFromCLI(argv);