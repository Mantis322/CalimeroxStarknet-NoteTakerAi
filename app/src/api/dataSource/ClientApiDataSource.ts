import {
  ApiResponse,
  JsonRpcClient,
  RequestConfig,
  WsSubscriptionsClient,
  RpcError,
  handleRpcError,
} from '@calimero-network/calimero-client';
import {
  ClientApi,
  ClientMethod,
  Note,
  CreateNoteRequest,
  CreateNoteResponse,
  ListNotesResponse,
  GetNoteResponse,
  UpdateNoteRequest,
  UpdateNoteResponse,
  DeleteNoteResponse,
} from '../clientApi';
import { getContextId, getNodeUrl } from '../../utils/node';
import {
  getJWTObject,
  getStorageAppEndpointKey,
  JsonWebToken,
} from '../../utils/storage';
import { AxiosHeader, createJwtHeader } from '../../utils/jwtHeaders';
import { getRpcPath } from '../../utils/env';

export function getJsonRpcClient() {
  return new JsonRpcClient(getStorageAppEndpointKey() ?? '', getRpcPath());
}

export function getWsSubscriptionsClient() {
  return new WsSubscriptionsClient(getStorageAppEndpointKey() ?? '', '/ws');
}

function getConfigAndJwt() {
  const jwtObject: JsonWebToken | null = getJWTObject();
  const headers: AxiosHeader | null = createJwtHeader();
  if (!headers) {
    return {
      error: { message: 'Failed to create auth headers', code: 500 },
    };
  }
  if (!jwtObject) {
    return {
      error: { message: 'Failed to get JWT token', code: 500 },
    };
  }
  if (jwtObject.executor_public_key === null) {
    return {
      error: { message: 'Failed to get executor public key', code: 500 },
    };
  }

  const config: RequestConfig = {
    headers: headers,
    timeout: 10000,
  };

  return { jwtObject, config };
}

export class ClientApiDataSource implements ClientApi {
  private async handleError(
    error: RpcError,
    params: any,
    callbackFunction: any,
  ) {
    if (error && error.code) {
      const response = await handleRpcError(error, getNodeUrl);
      if (response.code === 403) {
        return await callbackFunction(params);
      }
      return {
        error: await handleRpcError(error, getNodeUrl),
      };
    }
  }

  async createNote(
    params: CreateNoteRequest,
  ): ApiResponse<CreateNoteResponse> {
    const { jwtObject, config, error } = getConfigAndJwt();
    if (error) {
      return { error };
    }

    const response = await getJsonRpcClient().mutate<
      CreateNoteRequest,
      CreateNoteResponse
    >(
      {
        contextId: jwtObject?.context_id ?? getContextId(),
        method: ClientMethod.CREATE_NOTE,
        argsJson: params,
        executorPublicKey: jwtObject.executor_public_key,
      },
      config,
    );
    if (response?.error) {
      return await this.handleError(response.error, params, this.createNote);
    }

    return {
      data: { noteId: Number(response?.result?.output) ?? 0 },
      error: null,
    };
  }

  async listNotes(): ApiResponse<ListNotesResponse> {
    const { jwtObject, config, error } = getConfigAndJwt();
    if (error) {
      return { error };
    }

    const response = await getJsonRpcClient().query<any, ListNotesResponse>(
      {
        contextId: jwtObject?.context_id ?? getContextId(),
        method: ClientMethod.LIST_NOTES,
        argsJson: {},
        executorPublicKey: jwtObject.executor_public_key,
      },
      config,
    );
    if (response?.error) {
      return await this.handleError(response.error, {}, this.listNotes);
    }

    return {
      data: { notes: response?.result?.output ?? [] },
      error: null,
    };
  }

  async getNote(noteId: number): ApiResponse<GetNoteResponse> {
    const { jwtObject, config, error } = getConfigAndJwt();
    if (error) {
      return { error };
    }

    const response = await getJsonRpcClient().query<any, GetNoteResponse>(
      {
        contextId: jwtObject?.context_id ?? getContextId(),
        method: ClientMethod.GET_NOTE,
        argsJson: { note_id: noteId },
        executorPublicKey: jwtObject.executor_public_key,
      },
      config,
    );
    if (response?.error) {
      return await this.handleError(response.error, { noteId }, this.getNote);
    }

    return {
      data: { note: response?.result?.output },
      error: null,
    };
  }

  async updateNote(
    params: UpdateNoteRequest,
  ): ApiResponse<UpdateNoteResponse> {
    const { jwtObject, config, error } = getConfigAndJwt();
    if (error) {
      return { error };
    }

    const response = await getJsonRpcClient().mutate<
      UpdateNoteRequest,
      UpdateNoteResponse
    >(
      {
        contextId: jwtObject?.context_id ?? getContextId(),
        method: ClientMethod.UPDATE_NOTE,
        argsJson: {
          note_id: params.noteId,
          new_title: params.title,
          new_content: params.content,
        },
        executorPublicKey: jwtObject.executor_public_key,
      },
      config,
    );
    if (response?.error) {
      return await this.handleError(response.error, params, this.updateNote);
    }

    return {
      data: {},
      error: null,
    };
  }

  async deleteNote(noteId: number): ApiResponse<DeleteNoteResponse> {
    const { jwtObject, config, error } = getConfigAndJwt();
    if (error) {
      return { error };
    }

    const response = await getJsonRpcClient().mutate<any, DeleteNoteResponse>(
      {
        contextId: jwtObject?.context_id ?? getContextId(),
        method: ClientMethod.DELETE_NOTE,
        argsJson: { note_id: noteId },
        executorPublicKey: jwtObject.executor_public_key,
      },
      config,
    );
    if (response?.error) {
      return await this.handleError(response.error, { noteId }, this.deleteNote);
    }

    return {
      data: {},
      error: null,
    };
  }
}