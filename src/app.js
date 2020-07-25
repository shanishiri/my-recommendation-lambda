const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient();


exports.handler = async (event, context, callback) => {
    try {

        if (!event.requestContext.authorizer) {
            errorResponse('Authorization not configured', context.awsRequestId, callback);
            return;
        }

        console.log(`Received event: ${event}`);

        // Because we're using a Cognito User Pools authorizer, all of the claims
        // included in the authentication token are provided in the request context.
        // This includes the username as well as other attributes.
        const username = event.requestContext.authorizer.claims['cognito:username'];

        // into an object. A more robust implementation might inspect the Content-Type
        // header first and use a different parsing strategy based on that value.
        const requestBody = JSON.parse(event.body);
        const httpMethod = event.httpMethod;

        if (httpMethod === 'GET') {
            let result = await getRecommendation("koaoDY0cEbaacz0Mhh4fER");
            console.log(`Get from DB result: ${result}`);
            callback(null, {
                statusCode: 200,
                body: JSON.stringify(result)
            });
        } else if (httpMethod === 'POST') {
            //TODO: contract data object from body
            let result = await putRecommendation("koaoDY0cEbaacz0Mhh4fER", data);
            console.log(`Get from DB result: ${result}`);
            // Because this Lambda function is called by an API Gateway proxy integration
            // the result object must use the following structure.
            callback(null, {
                statusCode: 201,
                body: JSON.stringify({
                    // RideId: rideId,
                    // Unicorn: unicorn,
                    // UnicornName: unicorn.Name,
                    // Eta: '30 seconds',
                    // Rider: username,
                }),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                }
            })
        }
    } catch (err) {
        console.error(err);
        // If there is an error during processing, catch it and return
        // from the Lambda function successfully. Specify a 500 HTTP status
        // code and provide an error message in the body. This will provide a
        // more meaningful error response to the end client.
        errorResponse(err.message, context.awsRequestId, callback)
    }
};

async function putRecommendation(userId, data) {
    return ddb.put({
        TableName: 'my-recommendation',
        Item: {
            UserId: userId,
            Address: data.address,
            Area: data.area,
            Category: data.category,
            Comments: data.comments,
            RecommendedBy: data.recommendedBy,
            RestaurantName: data.restaurantName,
            Visited: data.visited,
            Website: data.website,
            WouldRecommend: data.wouldRecommend
        },
    }).promise();
}

async function getRecommendation(userId) {
    return ddb.get({
        TableName: 'my-recommendation',
        Key: {
            "UserId": userId
        }
    }).promise();
}


function errorResponse(errorMessage, awsRequestId, callback) {
    callback(null, {
        statusCode: 500,
        body: JSON.stringify({
            Error: errorMessage,
            Reference: awsRequestId,
        }),
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    });
}