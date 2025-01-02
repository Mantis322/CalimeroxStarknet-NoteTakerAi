import { ApiResponse } from '@calimero-network/calimero-client';

// Note type definition
export interface Note {
    id: number;
    title: string;
    content: string;
}

// Request interfaces
export interface CreateNoteRequest {
    title: string;
    content: string;
}

export interface UpdateNoteRequest {
    noteId: number;
    title?: string;
    content?: string;
}

// Response interfaces
export interface CreateNoteResponse {
    noteId: number;
}

export interface ListNotesResponse {
    notes: Note[];
}

export interface GetNoteResponse {
    note: Note;
}

export interface UpdateNoteResponse {}

export interface DeleteNoteResponse {}

// Client method enum
export enum ClientMethod {
    CREATE_NOTE = 'create_note',
    LIST_NOTES = 'list_notes',
    GET_NOTE = 'get_note',
    UPDATE_NOTE = 'update_note',
    DELETE_NOTE = 'delete_note',
}

// Client API interface
export interface ClientApi {
    createNote(params: CreateNoteRequest): ApiResponse<CreateNoteResponse>;
    listNotes(): ApiResponse<ListNotesResponse>;
    getNote(noteId: number): ApiResponse<GetNoteResponse>;
    updateNote(params: UpdateNoteRequest): ApiResponse<UpdateNoteResponse>;
    deleteNote(noteId: number): ApiResponse<DeleteNoteResponse>;
}