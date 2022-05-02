import {aws_ssm} from "aws-cdk-lib";
import {Construct} from "constructs";

export class VideoSearchSsm {

    private readonly _scope: Construct;
    private readonly _stageName: string;

    private readonly ContentBucketNameParam = 'bucket-name/content';
    private readonly VideoDynamoDbTableNameParam = 'dynamodb-table-name/video';
    private readonly SubtitleQueueArnParam = 'queue/subtitle';
    private readonly SubtitleIndexTopicArnParam = 'topic/index';
    private readonly TantivySearchFunctionNameParam = 'function/tantivy-search'
    private readonly KendraIndexIdParam = 'kendra/video'
    private readonly ContentDomaniNameParam = 'domain-name/content'

    constructor(scope: Construct, stageName: string) {
        this._scope = scope;
        this._stageName = stageName;
    }

    private _parameterName(name: string): string {
        return `/video-search/${this._stageName}/${name}`;
    }

    private _setStringValue(parameterName: string, value: string) {
        new aws_ssm.StringParameter(this._scope, parameterName, {
            parameterName: this._parameterName(parameterName),
            stringValue: value
        });
    }

    private _getStringValue(parameterName: string): string {
        return aws_ssm.StringParameter
            .fromStringParameterName(this._scope, parameterName, this._parameterName(parameterName))
            .stringValue;
    }

    set contentBucketName(name: string) {
        this._setStringValue(this.ContentBucketNameParam, name);
    }

    get contentBucketName(): string {
        return this._getStringValue(this.ContentBucketNameParam);
    }

    set videoDynamoDBTableName(name: string) {
        this._setStringValue(this.VideoDynamoDbTableNameParam, name);
    }

    get videoDynamoDBTableName(): string {
        return this._getStringValue(this.VideoDynamoDbTableNameParam);
    }

    set subtitleQueueArn(name: string) {
        this._setStringValue(this.SubtitleQueueArnParam, name);
    }

    get subtitleQueueArn(): string {
        return this._getStringValue(this.SubtitleQueueArnParam);
    }

    set subtitleIndexTopicArn(name: string) {
        this._setStringValue(this.SubtitleIndexTopicArnParam, name);
    }

    get subtitleIndexTopicArn(): string {
        return this._getStringValue(this.SubtitleIndexTopicArnParam);
    }

    set tantivySearchFunctionName(name: string) {
        this._setStringValue(this.TantivySearchFunctionNameParam, name);
    }

    get tantivySearchFunctionName(): string {
        return this._getStringValue(this.TantivySearchFunctionNameParam);
    }

    set kendraIndexId(name: string) {
        this._setStringValue(this.KendraIndexIdParam, name);
    }

    get kendraIndexId(): string {
        return this._getStringValue(this.KendraIndexIdParam);
    }

    set contentDomainName(name: string) {
        this._setStringValue(this.ContentDomaniNameParam, name);
    }

    get contentDomainName(): string {
        return this._getStringValue(this.ContentDomaniNameParam);
    }

}