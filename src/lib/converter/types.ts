export type ConvertStatus = 'pending' | 'converting' | 'done' | 'error';

export interface ConvertItem {
	id: string;
	file: File;
	previewUrl: string;
	status: ConvertStatus;
	outputUrl?: string;
	outputBlob?: Blob;
	outputName?: string;
	error?: string;
}
