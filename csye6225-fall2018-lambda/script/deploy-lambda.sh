#!/bin/bash
aws lambda update-function-code --region us-east-1 --function-name index --s3-bucket $s3_bucket --s3-key LambdaApp.zip 
