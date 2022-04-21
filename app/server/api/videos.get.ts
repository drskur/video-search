import {ddbDocClient} from "~/lib/dynamodb-document-client";
import {ScanCommand} from "@aws-sdk/lib-dynamodb";
import dotenv from 'dotenv';

dotenv.config();

export default async function () {

    const tableName = process.env.NUXT_DYNAMODB_TABLE_NAME || '';
    const data = await ddbDocClient.send(new ScanCommand({
        TableName: tableName,
        ProjectionExpression: 'id, title, video_key, subtitles, thumbnail_key',
    }));

    const items = data.Items;

    return {
        items,
    }
};