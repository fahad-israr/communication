const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.THOUGHTS_TABLE;
const AUTH_USERNAME = process.env.AUTH_USERNAME;
const AUTH_PASSWORD = process.env.AUTH_PASSWORD;

// Simple CORS headers
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': '*'
};

const verifyBasicAuth = (event) => {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return false;
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    const [username, password] = credentials.split(':');

    return username === AUTH_USERNAME && password === AUTH_PASSWORD;
};

const handleGetThoughts = async () => {
    const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'attribute_not_exists(isDeleted) OR isDeleted = :false',
        ExpressionAttributeValues: {
            ':false': false
        }
    });

    const result = await docClient.send(command);
    return result.Items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
};

const handlePostThought = async (body) => {
    const timestamp = new Date().toISOString();
    const item = {
        id: `thought_${timestamp}`,
        content: body.content,
        timestamp: timestamp,
        category: body.category || 'general',
        status: 'pending',
        isAcknowledged: false,
        actionTaken: false,
        isDeleted: false
    };

    const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: item
    });

    await docClient.send(command);
    return item;
};

const handleUpdateThought = async (body) => {
    const { id, timestamp, status, isAcknowledged, actionTaken } = body;

    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (status !== undefined) {
        updateExpression.push('#status = :status');
        expressionAttributeNames['#status'] = 'status';
        expressionAttributeValues[':status'] = status;
    }

    if (isAcknowledged !== undefined) {
        updateExpression.push('#ack = :ack');
        expressionAttributeNames['#ack'] = 'isAcknowledged';
        expressionAttributeValues[':ack'] = isAcknowledged;
    }

    if (actionTaken !== undefined) {
        updateExpression.push('#action = :action');
        expressionAttributeNames['#action'] = 'actionTaken';
        expressionAttributeValues[':action'] = actionTaken;
    }

    const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
            id,
            timestamp
        },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(command);
    return result.Attributes;
};

const handleDeleteThought = async (body) => {
    const { id, timestamp } = body;

    const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
            id,
            timestamp
        },
        UpdateExpression: 'SET isDeleted = :true',
        ExpressionAttributeValues: {
            ':true': true
        },
        ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(command);
    return result.Attributes;
};

exports.handler = async (event) => {
    // Always return CORS headers for OPTIONS requests
    if (event.requestContext.http.method === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'OK' })
        };
    }

    try {
        // Verify authentication for non-OPTIONS requests
        if (!verifyBasicAuth(event)) {
            return {
                statusCode: 401,
                headers: {
                    ...headers,
                    'WWW-Authenticate': 'Basic realm="Catty Portal"'
                },
                body: JSON.stringify({ message: 'Unauthorized' })
            };
        }

        let response;
        const body = event.body ? JSON.parse(event.body) : {};

        switch (event.requestContext.http.method) {
            case 'GET':
                const thoughts = await handleGetThoughts();
                response = {
                    message: 'Thoughts retrieved successfully',
                    thoughts
                };
                break;

            case 'POST':
                const newThought = await handlePostThought(body);
                response = {
                    message: 'Thought submitted successfully',
                    thought: newThought
                };
                break;

            case 'PUT':
                const updatedThought = await handleUpdateThought(body);
                response = {
                    message: 'Thought updated successfully',
                    thought: updatedThought
                };
                break;

            case 'DELETE':
                const deletedThought = await handleDeleteThought(body);
                response = {
                    message: 'Thought deleted successfully',
                    thought: deletedThought
                };
                break;

            default:
                return {
                    statusCode: 405,
                    headers,
                    body: JSON.stringify({ message: 'Method not allowed' })
                };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response)
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                message: 'Error processing request',
                error: error.message
            })
        };
    }
}; 