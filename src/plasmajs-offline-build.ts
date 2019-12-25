/**
 * @module Offline Build and sign tx
 */

import * as ecc from "@plasma/plasmajs-ecc";
import {CachedAbi} from "./plasmajs-api-interfaces";
import {Abi} from "./plasmajs-rpc-interfaces";
import * as ser from "./plasmajs-serialize";

// tslint:disable-next-line
const abiAbi = require('../src/abi.abi.json');
// tslint:disable-next-line
const transactionAbi = require('../src/transaction.abi.json');

export default class OfflineBuilder {
    /** Identifies chain */
    public chainId: string;

    public textEncoder: TextEncoder;
    public textDecoder: TextDecoder;

    /** Converts abi files between binary and structured form (`abi.abi.json`) */
    public abiTypes: Map<string, ser.Type>;

    /** Converts transactions between binary and structured form (`transaction.abi.json`) */
    public transactionTypes: Map<string, ser.Type>;

    /** Holds information needed to serialize contract actions */
    public contracts = new Map<string, ser.Contract>();

    /** Fetched abis */
    public cachedAbis = new Map<string, CachedAbi>();

    /**
     * @param args
     *    * `chainId`: Identifies chain
     *    * `abis`: preloaded abi of contract
     *    * `textEncoder`: `TextEncoder` instance to use. Pass in `null` if running in a browser
     *    * `textDecoder`: `TextDecoder` instance to use. Pass in `null` if running in a browser
     */
    constructor(args: {
        chainId?: string,
        textEncoder?: TextEncoder,
        textDecoder?: TextDecoder,
    }) {
        this.chainId = args.chainId;
        this.textDecoder = args.textDecoder;
        this.textEncoder = args.textEncoder;
        this.abiTypes = ser.getTypesFromAbi(ser.createInitialTypes(), abiAbi);
        this.transactionTypes = ser.getTypesFromAbi(ser.createInitialTypes(), transactionAbi);
    }

    public addAbis(rawAbis: Map<string, Uint8Array>) {
        const abis = new Map<string, CachedAbi>();
        for (const [account, rawAbi] of rawAbis) {
            let cachedAbi: CachedAbi;
            const abi = this.rawAbiToJson(Uint8Array.from(rawAbi));
            cachedAbi = {rawAbi, abi};
            this.cachedAbis.set(account, cachedAbi);
        }
    }
    /** Convert a transaction to binary */
    public serializeTransaction(transaction: any): Uint8Array {
        const buffer = new ser.SerialBuffer({textEncoder: this.textEncoder, textDecoder: this.textDecoder});
        this.serialize(buffer, "transaction", {
            max_net_usage_words: 0,
            max_cpu_usage_ms: 0,
            delay_sec: 0,
            context_free_actions: [],
            actions: [],
            transaction_extensions: [],
            ...transaction,
        });
        return buffer.asUint8Array();
    }

    /** Convert actions to hex */
    public async serializeActions(actions: ser.Action[]): Promise<ser.SerializedAction[]> {
        return await Promise.all(actions.map(async ({account, name, authorization, data}) => {
            const contract = await this.getContract(account);
            return ser.serializeAction(
                contract, account, name, authorization, data, this.textEncoder, this.textDecoder);
        }));
    }

    public constructTx(actions: ser.Action[], expiration: string, refBlockNum: string, refBlockPrefix: string) {
        return {
            actions,
            expiration,
            ref_block_num: refBlockNum,
            ref_block_prefix: refBlockPrefix,
        };
    }

    public async serializeAll(transaction: any) {
        const txSerializedActions = {
            ...transaction,
            actions: await this.serializeActions(transaction.actions),
        };
        return this.serializeTransaction(txSerializedActions);
    }

    public signTransaction(serializedTx: Uint8Array, privateKeys: string[]) {
        const signatures = [];
        for (const key of privateKeys) {
            const signBuf = Buffer.concat([
                new Buffer(this.chainId, "hex"), new Buffer(serializedTx), new Buffer(new Uint8Array(32)),
            ]);
            const signature = ecc.Signature.sign(signBuf, key).toString();
            signatures.push(signature);
        }
        return signatures;
    }

    /** Decodes an abi as Uint8Array into json. */
    private rawAbiToJson(rawAbi: Uint8Array): Abi {
        const buffer = new ser.SerialBuffer({
            textEncoder: this.textEncoder,
            textDecoder: this.textDecoder,
            array: rawAbi,
        });
        if (!ser.supportedAbiVersion(buffer.getString())) {
            throw new Error("Unsupported abi version");
        }
        buffer.restartRead();
        return this.abiTypes.get("abi_def").deserialize(buffer);
    }

    /** Get data needed to serialize actions in a contract */
    private async getContract(accountName: string, reload = false): Promise<ser.Contract> {
        if (!reload && this.contracts.get(accountName)) {
            return this.contracts.get(accountName);
        }
        const cachedAbi = this.cachedAbis.get(accountName);
        if (!cachedAbi) {
            throw new Error(`abi for account ${accountName} is not provided`);
        }
        const abi = cachedAbi.abi;
        const types = ser.getTypesFromAbi(ser.createInitialTypes(), abi);
        const actions = new Map<string, ser.Type>();
        for (const {name, type} of abi.actions) {
            actions.set(name, ser.getType(types, type));
        }
        const result = {types, actions};
        this.contracts.set(accountName, result);
        return result;
    }

    /** Convert `value` to binary form. `type` must be a built-in abi type or in `transaction.abi.json`. */
    private serialize(buffer: ser.SerialBuffer, type: string, value: any): void {
        this.transactionTypes.get(type).serialize(buffer, value);
    }
}
