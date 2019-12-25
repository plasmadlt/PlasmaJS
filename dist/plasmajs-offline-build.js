"use strict";
/**
 * @module Offline Build and sign tx
 */
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var ecc = require("@plasma/plasmajs-ecc");
var ser = require("./plasmajs-serialize");
// tslint:disable-next-line
var abiAbi = require('../src/abi.abi.json');
// tslint:disable-next-line
var transactionAbi = require('../src/transaction.abi.json');
var OfflineBuilder = /** @class */ (function () {
    /**
     * @param args
     *    * `chainId`: Identifies chain
     *    * `abis`: preloaded abi of contract
     *    * `textEncoder`: `TextEncoder` instance to use. Pass in `null` if running in a browser
     *    * `textDecoder`: `TextDecoder` instance to use. Pass in `null` if running in a browser
     */
    function OfflineBuilder(args) {
        /** Holds information needed to serialize contract actions */
        this.contracts = new Map();
        /** Fetched abis */
        this.cachedAbis = new Map();
        this.chainId = args.chainId;
        this.textDecoder = args.textDecoder;
        this.textEncoder = args.textEncoder;
        this.abiTypes = ser.getTypesFromAbi(ser.createInitialTypes(), abiAbi);
        this.transactionTypes = ser.getTypesFromAbi(ser.createInitialTypes(), transactionAbi);
    }
    OfflineBuilder.prototype.addAbis = function (rawAbis) {
        var e_1, _a;
        var abis = new Map();
        try {
            for (var rawAbis_1 = __values(rawAbis), rawAbis_1_1 = rawAbis_1.next(); !rawAbis_1_1.done; rawAbis_1_1 = rawAbis_1.next()) {
                var _b = __read(rawAbis_1_1.value, 2), account = _b[0], rawAbi = _b[1];
                var cachedAbi = void 0;
                var abi = this.rawAbiToJson(Uint8Array.from(rawAbi));
                cachedAbi = { rawAbi: rawAbi, abi: abi };
                this.cachedAbis.set(account, cachedAbi);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (rawAbis_1_1 && !rawAbis_1_1.done && (_a = rawAbis_1.return)) _a.call(rawAbis_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    /** Convert a transaction to binary */
    OfflineBuilder.prototype.serializeTransaction = function (transaction) {
        var buffer = new ser.SerialBuffer({ textEncoder: this.textEncoder, textDecoder: this.textDecoder });
        this.serialize(buffer, "transaction", __assign({ max_net_usage_words: 0, max_cpu_usage_ms: 0, delay_sec: 0, context_free_actions: [], actions: [], transaction_extensions: [] }, transaction));
        return buffer.asUint8Array();
    };
    /** Convert actions to hex */
    OfflineBuilder.prototype.serializeActions = function (actions) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(actions.map(function (_a) {
                            var account = _a.account, name = _a.name, authorization = _a.authorization, data = _a.data;
                            return __awaiter(_this, void 0, void 0, function () {
                                var contract;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0: return [4 /*yield*/, this.getContract(account)];
                                        case 1:
                                            contract = _b.sent();
                                            return [2 /*return*/, ser.serializeAction(contract, account, name, authorization, data, this.textEncoder, this.textDecoder)];
                                    }
                                });
                            });
                        }))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    OfflineBuilder.prototype.constructTx = function (actions, expiration, refBlockNum, refBlockPrefix) {
        return {
            actions: actions,
            expiration: expiration,
            ref_block_num: refBlockNum,
            ref_block_prefix: refBlockPrefix,
        };
    };
    OfflineBuilder.prototype.serializeAll = function (transaction) {
        return __awaiter(this, void 0, void 0, function () {
            var txSerializedActions, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = [{}, transaction];
                        _b = {};
                        return [4 /*yield*/, this.serializeActions(transaction.actions)];
                    case 1:
                        txSerializedActions = __assign.apply(void 0, _a.concat([(_b.actions = _c.sent(), _b)]));
                        return [2 /*return*/, this.serializeTransaction(txSerializedActions)];
                }
            });
        });
    };
    OfflineBuilder.prototype.signTransaction = function (serializedTx, privateKeys) {
        var e_2, _a;
        var signatures = [];
        try {
            for (var privateKeys_1 = __values(privateKeys), privateKeys_1_1 = privateKeys_1.next(); !privateKeys_1_1.done; privateKeys_1_1 = privateKeys_1.next()) {
                var key = privateKeys_1_1.value;
                var signBuf = Buffer.concat([
                    new Buffer(this.chainId, "hex"), new Buffer(serializedTx), new Buffer(new Uint8Array(32)),
                ]);
                var signature = ecc.Signature.sign(signBuf, key).toString();
                signatures.push(signature);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (privateKeys_1_1 && !privateKeys_1_1.done && (_a = privateKeys_1.return)) _a.call(privateKeys_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return signatures;
    };
    /** Decodes an abi as Uint8Array into json. */
    OfflineBuilder.prototype.rawAbiToJson = function (rawAbi) {
        var buffer = new ser.SerialBuffer({
            textEncoder: this.textEncoder,
            textDecoder: this.textDecoder,
            array: rawAbi,
        });
        if (!ser.supportedAbiVersion(buffer.getString())) {
            throw new Error("Unsupported abi version");
        }
        buffer.restartRead();
        return this.abiTypes.get("abi_def").deserialize(buffer);
    };
    /** Get data needed to serialize actions in a contract */
    OfflineBuilder.prototype.getContract = function (accountName, reload) {
        if (reload === void 0) { reload = false; }
        return __awaiter(this, void 0, void 0, function () {
            var e_3, _a, cachedAbi, abi, types, actions, _b, _c, _d, name_1, type, result;
            return __generator(this, function (_e) {
                if (!reload && this.contracts.get(accountName)) {
                    return [2 /*return*/, this.contracts.get(accountName)];
                }
                cachedAbi = this.cachedAbis.get(accountName);
                if (!cachedAbi) {
                    throw new Error("abi for account " + accountName + " is not provided");
                }
                abi = cachedAbi.abi;
                types = ser.getTypesFromAbi(ser.createInitialTypes(), abi);
                actions = new Map();
                try {
                    for (_b = __values(abi.actions), _c = _b.next(); !_c.done; _c = _b.next()) {
                        _d = _c.value, name_1 = _d.name, type = _d.type;
                        actions.set(name_1, ser.getType(types, type));
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
                result = { types: types, actions: actions };
                this.contracts.set(accountName, result);
                return [2 /*return*/, result];
            });
        });
    };
    /** Convert `value` to binary form. `type` must be a built-in abi type or in `transaction.abi.json`. */
    OfflineBuilder.prototype.serialize = function (buffer, type, value) {
        this.transactionTypes.get(type).serialize(buffer, value);
    };
    return OfflineBuilder;
}());
exports.default = OfflineBuilder;
//# sourceMappingURL=plasmajs-offline-build.js.map