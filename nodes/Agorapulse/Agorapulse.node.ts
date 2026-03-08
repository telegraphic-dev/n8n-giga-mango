import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	INodePropertyOptions,
	IDataObject,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { agorapulseApiRequest, agorapulseApiRequestAllItems } from './GenericFunctions';

export class Agorapulse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Agorapulse',
		name: 'agorapulse',
		icon: 'file:agorapulse.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Agorapulse API',
		defaults: {
			name: 'Agorapulse',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'agorapulseApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Organization', value: 'organization' },
					{ name: 'Workspace', value: 'workspace' },
					{ name: 'Profile', value: 'profile' },
					{ name: 'Simple Draft', value: 'simpleDraft' },
					{ name: 'Scheduled Post', value: 'scheduledPost' },
				],
				default: 'simpleDraft',
			},

			// Organization operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: { resource: ['organization'] },
				},
				options: [
					{ name: 'List', value: 'list', action: 'List organizations' },
				],
				default: 'list',
			},

			// Workspace operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: { resource: ['workspace'] },
				},
				options: [
					{ name: 'List', value: 'list', action: 'List workspaces' },
				],
				default: 'list',
			},
			{
				displayName: 'Organization ID',
				name: 'organizationId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getOrganizations',
				},
				required: true,
				displayOptions: {
					show: { resource: ['workspace', 'profile', 'simpleDraft', 'scheduledPost'] },
				},
				default: '',
				description: 'The organization to use',
			},

			// Profile operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: { resource: ['profile'] },
				},
				options: [
					{ name: 'List', value: 'list', action: 'List profiles' },
				],
				default: 'list',
			},
			{
				displayName: 'Workspace ID',
				name: 'workspaceId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getWorkspaces',
					loadOptionsDependsOn: ['organizationId'],
				},
				required: true,
				displayOptions: {
					show: { resource: ['profile', 'simpleDraft', 'scheduledPost'] },
				},
				default: '',
				description: 'The workspace to use',
			},

			// Simple Draft operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: { resource: ['simpleDraft'] },
				},
				options: [
					{ name: 'Create', value: 'create', action: 'Create a simple draft' },
				],
				default: 'create',
			},

			// Scheduled Post operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: { resource: ['scheduledPost'] },
				},
				options: [
					{ name: 'Create', value: 'create', action: 'Create a scheduled post' },
				],
				default: 'create',
			},

			// Draft/Post fields
			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				required: true,
				displayOptions: {
					show: { resource: ['simpleDraft', 'scheduledPost'], operation: ['create'] },
				},
				default: '',
				description: 'The text content of the post',
			},
			{
				displayName: 'Post Type',
				name: 'postType',
				type: 'options',
				options: [
					{ name: 'Text', value: 'TEXT' },
					{ name: 'Photo', value: 'PHOTO' },
					{ name: 'Video', value: 'VIDEO' },
					{ name: 'Photo and Video', value: 'PHOTO_AND_VIDEO' },
					{ name: 'Link', value: 'LINK' },
				],
				displayOptions: {
					show: { resource: ['simpleDraft', 'scheduledPost'], operation: ['create'] },
				},
				default: 'STANDARD',
			},
			{
				displayName: 'Profile UIDs',
				name: 'profileUids',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getProfiles',
					loadOptionsDependsOn: ['organizationId', 'workspaceId'],
				},
				required: true,
				displayOptions: {
					show: { resource: ['simpleDraft', 'scheduledPost'], operation: ['create'] },
				},
				default: [],
				description: 'Profiles to post to',
			},

			// Additional options
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: { resource: ['simpleDraft', 'scheduledPost'], operation: ['create'] },
				},
				default: {},
				options: [
					{
						displayName: 'Link',
						name: 'link',
						type: 'string',
						default: '',
						description: 'Link URL to include in the post',
					},
					{
						displayName: 'Media URLs',
						name: 'mediaUrls',
						type: 'string',
						default: '',
						description: 'Comma-separated list of media URLs',
					},
					{
						displayName: 'Labels',
						name: 'labels',
						type: 'string',
						default: '',
						description: 'Comma-separated list of labels',
					},
				],
			},

			// Scheduled post specific fields
			{
				displayName: 'Scheduled Time',
				name: 'scheduledTime',
				type: 'dateTime',
				required: true,
				displayOptions: {
					show: { resource: ['scheduledPost'], operation: ['create'] },
				},
				default: '',
				description: 'When to publish the post (ISO 8601 format)',
			},
		],
	};

	methods = {
		loadOptions: {
			async getOrganizations(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const orgs = await agorapulseApiRequestAllItems.call(
					this, 'GET', '/v1.0/core/organizations', 'organizations'
				);
				return orgs.map((org) => ({
					name: org.organizationName as string,
					value: org.organizationId as number,
				}));
			},

			async getWorkspaces(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const organizationId = this.getCurrentNodeParameter('organizationId') as number;
				if (!organizationId) return [];
				
				const workspaces = await agorapulseApiRequestAllItems.call(
					this, 'GET', `/v1.0/core/organizations/${organizationId}/workspaces`, 'workspaces'
				);
				return workspaces.map((ws) => ({
					name: ws.workspaceName as string,
					value: ws.workspaceId as number,
				}));
			},

			async getProfiles(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const organizationId = this.getCurrentNodeParameter('organizationId') as number;
				const workspaceId = this.getCurrentNodeParameter('workspaceId') as number;
				if (!organizationId || !workspaceId) return [];
				
				const profiles = await agorapulseApiRequestAllItems.call(
					this, 'GET', `/v1.0/core/organizations/${organizationId}/workspaces/${workspaceId}/profiles`, 'profiles'
				);
				return profiles.map((p) => ({
					name: `${p.profileName} (${p.profileType})`,
					value: p.profileUid as string,
				}));
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: IDataObject | IDataObject[];

				if (resource === 'organization') {
					if (operation === 'list') {
						responseData = await agorapulseApiRequest.call(this, 'GET', '/v1.0/core/organizations');
					}
				} else if (resource === 'workspace') {
					if (operation === 'list') {
						const organizationId = this.getNodeParameter('organizationId', i) as number;
						responseData = await agorapulseApiRequest.call(
							this, 'GET', `/v1.0/core/organizations/${organizationId}/workspaces`
						);
					}
				} else if (resource === 'profile') {
					if (operation === 'list') {
						const organizationId = this.getNodeParameter('organizationId', i) as number;
						const workspaceId = this.getNodeParameter('workspaceId', i) as number;
						responseData = await agorapulseApiRequest.call(
							this, 'GET', `/v1.0/core/organizations/${organizationId}/workspaces/${workspaceId}/profiles`
						);
					}
				} else if (resource === 'simpleDraft') {
					if (operation === 'create') {
						const organizationId = this.getNodeParameter('organizationId', i) as number;
						const workspaceId = this.getNodeParameter('workspaceId', i) as number;
						const text = this.getNodeParameter('text', i) as string;
						const postType = this.getNodeParameter('postType', i) as string;
						const profileUids = this.getNodeParameter('profileUids', i) as string[];
						const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

						const body: IDataObject = {
							text,
							type: postType,
							scheduling: profileUids.map(uid => ({ profileUid: uid })),
						};

						if (additionalFields.link) {
							body.link = additionalFields.link;
						}
						if (additionalFields.mediaUrls) {
							body.mediaUrls = (additionalFields.mediaUrls as string).split(',').map(s => s.trim());
						}
						if (additionalFields.labels) {
							body.labels = (additionalFields.labels as string).split(',').map(s => s.trim());
						}

						responseData = await agorapulseApiRequest.call(
							this, 'POST', `/v1.0/publishing/organizations/${organizationId}/workspaces/${workspaceId}/simple-drafts`, body
						);
					}
				} else if (resource === 'scheduledPost') {
					if (operation === 'create') {
						const organizationId = this.getNodeParameter('organizationId', i) as number;
						const workspaceId = this.getNodeParameter('workspaceId', i) as number;
						const text = this.getNodeParameter('text', i) as string;
						const postType = this.getNodeParameter('postType', i) as string;
						const profileUids = this.getNodeParameter('profileUids', i) as string[];
						const scheduledTime = this.getNodeParameter('scheduledTime', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

						const body: IDataObject = {
							text,
							type: postType,
							scheduling: profileUids.map(uid => ({ 
								profileUid: uid,
								publishingDate: scheduledTime,
							})),
						};

						if (additionalFields.link) {
							body.link = additionalFields.link;
						}
						if (additionalFields.mediaUrls) {
							body.mediaUrls = (additionalFields.mediaUrls as string).split(',').map(s => s.trim());
						}
						if (additionalFields.labels) {
							body.labels = (additionalFields.labels as string).split(',').map(s => s.trim());
						}

						responseData = await agorapulseApiRequest.call(
							this, 'POST', `/v1.0/publishing/organizations/${organizationId}/workspaces/${workspaceId}/simple-schedule-posts`, body
						);
					}
				}

				if (responseData!) {
					if (Array.isArray(responseData)) {
						returnData.push(...responseData.map(data => ({ json: data })));
					} else {
						returnData.push({ json: responseData });
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
