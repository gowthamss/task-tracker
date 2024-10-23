export const validCommandsSet = new Set([
    'add',
    'update',
    'delete',
    'mark-in-progress',
    'mark-done',
    'list'
]);

export const taskModel = [
    'id',
    'description',
    'status',
    'createdAt',
    'updatedAt'
];

export const validListCommands = new Set([
    'done',
    'todo',
    'in-progress'
]);