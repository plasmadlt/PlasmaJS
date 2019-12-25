# Plasmajs

Javascript API for integration with PlasmaDLT  using [PlasmaDLT RPC API](https://developer.plasmapay.com/chain.html).

## Installation

### NodeJS Dependency

`npm install plasmajs@beta` or `yarn add plasmajs@beta`

### Web Applications Distribution

Clone this repository locally then run `npm run build-web` or `yarn build-web`.  The browser distribution will be located in `dist-web` and can be directly copied into your project repository. The `dist-web` folder contains minified bundles ready for production, along with source mapped versions of the library for debugging.

## Import

### ES6 Modules

Importing using ES6 module syntax in the browser is supported if you have a transpiler, such as Babel.
```js
import { Api, JsonRpc, RpcError } from 'plasmajs';

import JsSignatureProvider from 'plasmajs/dist/plasmajs-jssig'; // development only
```

### CommonJS

Importing using commonJS syntax is supported by NodeJS out of the box.
```js
const { Api, JsonRpc, RpcError } = require('plasmajs');
const JsSignatureProvider = require('plasmajs/dist/plasmajs-jssig');  // development only
const fetch = require('node-fetch');                            // node only; not needed in browsers
const { TextEncoder, TextDecoder } = require('util');           // node only; native TextEncoder/Decoder
const { TextEncoder, TextDecoder } = require('text-encoding');  // React Native, IE11, and Edge Browsers only
```

## Basic Usage

### Signature Provider Plasmapay

* Wallet: https://plasmapay.com


```js
const defaultPrivateKey = "5HwurBQZNFGkBbkqm3Ayh5ntrHRfQe5dsYfWjfug3BLbgsbBеаScq"; // accountname1
const signatureProvider = new JsSignatureProvider([defaultPrivateKey]);
```

### JSON-RPC

Open a connection to JSON-RPC, include `fetch` when on NodeJS.
```js
const rpc = new JsonRpc('http://127.0.0.1:8888', { fetch });
```

### API

Include textDecoder and textEncoder when using in browser.
```js
const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });
```

### Sending a transaction

`transact()` is used to sign and push transactions onto the blockchain with an optional configuration object parameter.  This parameter can override the default value of `broadcast: true`, and can be used to fill TAPOS fields given `blocksBehind` and `expireSeconds`.  Given no configuration options, transactions are expected to be unpacked withfields (`expiration`, `ref_block_num`, `ref_block_prefix`) and will automatically be broadcast onto the chain.

```js
(async () => {
  const result = await api.transact({
    actions: [{
      account: 'plasma.token',
      name: 'transfer',
      authorization: [{
        actor: 'accountname1',
        permission: 'active',
      }],
      data: {
        from: 'accountname1',
        to: 'accountname2',
        quantity: '10.000000000000000000 PLASMA',
        memo: '',
      },
    }]
  }, {
    blocksBehind: 3,
    expireSeconds: 30,
  });
  console.dir(result);
})();
```

### Error handling

use `RpcError` for handling RPC Errors
```js
...
try {
  const result = await api.transact({
  ...
} catch (e) {
  console.log('\nCaught exception: ' + e);
  if (e instanceof RpcError)
    console.log(JSON.stringify(e.json, null, 2));
}
...
```

# Web Applications

## Usage
`npm run build-web` or `yarn build-web`

Reuse the `api` object for all transactions; it caches ABIs to reduce network usage. Only call `new plasmajs_api.default(...)` once.

```html
<pre style="width: 100%; height: 100%; margin:0px; "></pre>

<script src='dist-web/plasmajs-api.js'></script>
<script src='dist-web/plasmajs-jsonrpc.js'></script>
<script src='dist-web/plasmajs-jssig.js'></script>
<script>
  let pre = document.getElementsByTagName('pre')[0];
  const defaultPrivateKey = "5WaAScZK2XEp3g9gh7F8bwtPTRAkASmNrrftmx4AxDKD5K4zDke"; // accountname1
  const rpc = new plasmajs_jsonrpc.default('http://127.0.0.1:8888');
  const signatureProvider = new plasmajs_jssig.default([defaultPrivateKey]);
  const api = new plasmajs_api.default({ rpc, signatureProvider });

  (async () => {
    try {
      const result = await api.transact({
        actions: [{
            account: 'ion.token',
            name: 'transfer',
            authorization: [{
                actor: 'accountname1',
                permission: 'active',
            }],
            data: {
                from: 'useraaaaaaaa1',
                to: 'accountname2',
                quantity: '10.000000000000000000 PLASMA',
                memo: '',
            },
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      });
      pre.textContent += '\n\nTransaction pushed!\n\n' + JSON.stringify(result, null, 2);
    } catch (e) {
      pre.textContent = '\nCaught exception: ' + e;
      if (e instanceof plasmajs_jsonrpc.RpcError)
        pre.textContent += '\n\n' + JSON.stringify(e.json, null, 2);
    }
  })();
</script>
```

## Running Tests

### Automated Unit Test Suite
`npm run test` or `yarn test`

### Web Integration Test Suite
Run `npm run build-web` to build the browser distrubution then open `src/tests/web.html` in the browser of your choice.  The file should run through 6 tests, relaying the results onto the webpage with a 2 second delay after each test.  The final 2 tests should relay the exceptions being thrown onto the webpage for an invalid transaction and invalid rpc call.


### Debugging

If you would like readable source files for debugging, change the file reference to the `-debug.js` files inside `dist-web/debug` directory.  These files should only be used for development as they are over 10 times as large as the minified versions, and importing the debug versions will increase loading times for the end user.

### IE11 and Edge Support
If you need to support IE11 or Edge you will also need to install a text-encoding polyfill as plasmajs Signing is dependent on the TextEncoder which IE11 and Edge do not provide.  Pass the TextEncoder and TextDecoder to the API constructor as demonstrated in the [ES 2015 example](#node-es-2015).  Refer to the documentation here https://github.com/inexorabletash/text-encoding to determine the best way to include it in your project.

----------------------

# Reading Data from node

Reading blockchain state only requires an instance of `JsonRpc` connected to a node.

```javascript
const { JsonRpc } = require('plasmajs');
const fetch = require('node-fetch');           // node only; not needed in browsers
const rpc = new JsonRpc('http://127.0.0.1:8888', { fetch });
```

## Examples

### Get table rows

Get the first 10 token balances of account _accountname1_.

```javascript
const resp = await rpc.get_table_rows({
    json: true,              // Get the response as json
    code: 'plasma.token',     // Contract that we target
    scope: 'accountname1'         // Account that owns the data
    table: 'accounts'        // Table name
    limit: 10,               // Maximum number of rows that we want to get
    reverse = false,         // Optional: Get reversed data
});

console.log(resp.rows);
```
Output:

```json
{
  "rows": [{
      "balance": "10.000000000000000000 PLASMA"
    }
  ],
  "more": false
}
```

### Get one row by index

```javascript
const resp = await rpc.get_table_rows({
    json: true,                 // Get the response as json
    code: 'contract',           // Contract that we target
    scope: 'contract'           // Account that owns the data
    table: 'profiles'           // Table name
    lower_bound: 'accountname1'      // Table primary key value
    limit: 1,                   // Here we limit to 1 to get only the
    reverse = false,            // Optional: Get reversed data
    show_payer = false,         // Optional: Show ram payer
});
console.log(resp.rows);
```
Output:

```json
{
  "rows": [{
      "user": "accountname1",
      "age": 21,
      "surname": "Test"
    }
  ],
  "more": false
}
```

### Get one row by secondary index

```javascript
const resp = await rpc.get_table_rows({
    json: true,                 // Get the response as json
    code: 'contract',           // Contract that we target
    scope: 'contract'           // Account that owns the data
    table: 'profiles'           // Table name
    table_key: 'age'            // Table secondaray key name
    lower_bound: 21             // Table secondary key value
    limit: 1,                   // Here we limit to 1 to get only row
    reverse = false,            // Optional: Get reversed data
});
console.log(resp.rows);
```
Output:

```json
{
  "rows": [{
      "user": "accountname1",
      "age": 21,
      "surname": "Test"
    }
  ],
  "more": false
}
```

### Get currency balance

```javascript
console.log(await rpc.get_currency_balance('plasma.token', 'accountname1', ''));
```
Output:

```json
[ "10.000000000000000000 PLASMA" ]
```

### Get account info

```javascript
console.log(await rpc.get_account('accountname1'));
```
Output:

```json
{ "account_name": "accountname1",
  "head_block_num": 2029,
  "head_block_time": "2019-11-10T00:45:53.500",
  "privileged": false,
  "last_code_update": "1970-01-01T00:00:00.000",
  "created": "2019-11-10T00:37:05.000",
  "ram_usage": 1724,
  "permissions":
   [ { "perm_name": "active", "parent": "owner", "required_auth": [] },
     { "perm_name": "owner", "parent": "", "required_auth": [] } ],
  "refund_request": null,
}
```

### Get block

```javascript
console.log(await rpc.get_block(1));
```
Output:

```json
{ "timestamp": "2019-06-01T12:00:00.000",
  "producer": "",
  "confirmed": 1,
  "previous": "0000000000000000000000000000000000000000000000000000000000000000",
  "transaction_mroot": "0000000000000000000000000000000000000000000000000000000000000000",
  "action_mroot": "cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f",
  "schedule_version": 0,
  "new_producers": null,
  "header_extensions": [],
  "producer_signature": "SIG_K1_111111111111111111111111111111111111111111111111111111111111111116uk5ne",
  "transactions": [],
  "block_extensions": [],
  "id": "00000001bcf2f4433rd099685f14da76803028926af04d2607eafcf609c123d",
  "block_num": 1,
  "ref_block_prefix": 331719066 }
```
