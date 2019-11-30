console.log('Loading function');
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
const uuid = require("uuid");
var ses = new AWS.SES({
    region: 'us-east-1'
});

exports.handler = (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    var searchParams = {
        Key: {
            id: event.Records[0].Sns.Message
            // message:event.Records[0].Sns.Message
        },
        TableName: 'csye6225'
    };

    dynamo.get(searchParams, function (error, data1) {
        var resp = JSON.stringify(data1);
        //console.log("mayank>>>>>>>>>>>>>>>>>" + resp);
        //console.log("yesss");

        if (error) { // an error occurred
            console.log("---------->Error",error);
        }
        else {
            if (Object.keys(data1).length >= 0) {

                var flag = false;
                if(data1.Item == undefined){
                    flag = true;
                }else
                    if(data1.Item.TTL < (new Date).getTime()){
                        flag = true;
                    }

                if(flag){    
                    var milliseconds = (new Date).getTime() + (1000 * 60 * 20);
          //          console.log("Now:",(new Date).getTime());
          //          console.log("TTL:",milliseconds);
                    var params = {
                        Item: {
                            id: event.Records[0].Sns.Message,//event.Records[0].Sns.MessageId,
                            token: uuid.v4(),
                            TTL: milliseconds
                        },
                        TableName: 'csye6225'
                    };
    
                    dynamo.put(params, function (err, data) {
                        if (err) {
            //                console.log("1 ERROR =======");
                            callback(err, null);
                        } else {
              //              console.log("Data", data1);
                            callback(null, data);
                            var id = params.Item.token;
                            var username = event.Records[0].Sns.Message;
                //            console.log("MSG:", username);
                            var msgBody = "http://"+process.env.domainName+"/reset?email="+username+"&token="+id;
                            var sourceMail = "no-reply@"+process.env.domainName;
                            var eParams = {
                                Destination: {
                                    ToAddresses: [username]
                                },
                                Message: {
                                    Body: {
                                        Text: {
                                            Data: msgBody
                                        }
                                    },
                                    Subject: {
                                        Data: "Password Reset Request URL"
                                    }
                                },
                                Source: sourceMail
                            };
    
                  //          console.log('===SENDING EMAIL===');
                            var email = ses.sendEmail(eParams, function (err, data) {
                                if (err) {
                                    console.log("===========ERROR===========");
                                    console.log(err);
                                }
                                else {
                                    console.log("===EMAIL SENT===");
                                    console.log(data);
    
                                    console.log("EMAIL CODE END");
                                    //console.log('EMAIL: ', email);
                                    context.succeed(event);
                                }
                            });
                        }
                    });
                }
            } else
                console.log(data1, "User request already exists!!!!");
//             hereere
        }
    });

};
