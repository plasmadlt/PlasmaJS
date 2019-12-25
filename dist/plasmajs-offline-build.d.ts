/**
 * @module Offline Build and sign tx
 */
import { CachedAbi } from "./plasmajs-api-interfaces";
import * as ser from "./plasmajs-serialize";
export default class OfflineBuilder {
    /** Identifies chain */
    chainId: string;
    textEncoder: TextEncoder;
    textDecoder: TextDecoder;
    /** Converts abi files between binary and structured form (`abi.abi.json`) */
    abiTypes: Map<string, ser.Type>;
    /** Converts transactions between binary and structured form (`transaction.abi.json`) */
    transactionTypes: Map<string, ser.Type>;
    /** Holds information needed to serialize contract actions */
    contracts: Map<string, ser.Contract>;
    /** Fetched abis */
    cachedAbis: Map<string, CachedAbi>;
    /**
     * @param args
     *    * `chainId`: Identifies chain
     *    * `abis`: preloaded abi of contract
     *    * `textEncoder`: `TextEncoder` instance to use. Pass in `null` if running in a browser
     *    * `textDecoder`: `TextDecoder` instance to use. Pass in `null` if running in a browser
     */
    constructor(args: {
        chainId?: string;
        textEncoder?: TextEncoder;
        textDecoder?: TextDecoder;
    });
    addAbis(rawAbis: Map<string, Uint8Array>): void;
    /** Convert a transaction to binary */
    serializeTransaction(transaction: any): Uint8Array;
    /** Convert actions to hex */
    serializeActions(actions: ser.Action[]): Promise<ser.SerializedAction[]>;
    constructTx(actions: ser.Action[], expiration: string, refBlockNum: string, refBlockPrefix: string): {
        actions: ser.Action[];
        expiration: string;
        ref_block_num: string;
        ref_block_prefix: string;
    };
    serializeAll(transaction: any): Promise<Uint8Array>;
    signTransaction(serializedTx: Uint8Array, privateKeys: string[]): any[];
    /** Decodes an abi as Uint8Array into json. */
    private rawAbiToJson;
    /** Get data needed to serialize actions in a contract */
    private getContract;
    /** Convert `value` to binary form. `type` must be a built-in abi type or in `transaction.abi.json`. */
    private serialize;
}
