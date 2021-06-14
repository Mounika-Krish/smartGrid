const { TransactionHandler } = require('sawtooth-sdk/processor/handler');
const { InvalidTransaction } = require('sawtooth-sdk/processor/exceptions');
const cbor = require('cbor');
const ClientStore = require('./clientStore');

var { TP_FAMILY, TP_NAMESPACE } = require('./constants');

class smartGridHandler extends TransactionHandler {
    constructor() {
        super(TP_FAMILY, ['1.0'], [TP_NAMESPACE]);
    }

    async handleAddClientTransaction(context, payload) {
        const clientStore = new ClientStore(context);
        const clientExists = await clientStore.clientExists(payload.clientId);
        if (clientExists) {
            console.log("client Id : " + payload.clientId);
            throw new InvalidTransaction(`client with clientId : ${payload.clientId} already exists!`);
        } else {
            return await clientStore.addClient(payload);
        }
    }

    async handlepowerGenerationTransaction(context, payload) {
        const clientStore = new ClientStore(context);
        const clientExists = await clientStore.clientExists(payload.clientId);
        if (clientExists) {
            const producerExists = await clientStore.isProducer(payload.clientId);
            if (producerExists) {
                return await clientStore.generate(payload);
            } else {
                throw new InvalidTransaction(`producer with clientId : ${payload.clientId} does not exists!`);
            }
        }
        else {
            throw new InvalidTransaction(`client with clientId : ${payload.clientId} does not exists!`);
        }
    }


    async handlepowerTransmissionTransaction(context, payload) {
        const clientStore = new ClientStore(context);
        const clientExists = await clientStore.clientExists(payload.clientId);
        if (clientExists) {
            const consumerExists = await clientStore.isProducer(payload.clientId);
            const producerExists = await clientStore.isConsumer(payload.producerId);
            if (!producerExists && !consumerExists) {
                throw new InvalidTransaction(`producer with clientId : ${payload.producerId} or consumer with clientId : ${payload.clientId} does not exists!`);
            } else {
                const power = await clientStore.getPower(payload);
                if (!power) {
                    throw new InvalidTransaction(`power value should be less than producer's generation power or amount is insufficient, check your balance`);
                }
                else {
                    return power;
                }
            }
        }
        else {
            throw new InvalidTransaction(`client with clientId : ${payload.clientId} does not exists!`);
        }
    }

    async handlepowerConsumptionTransaction(context, payload) {
        const clientStore = new ClientStore(context);
        const clientExists = await clientStore.clientExists(payload.clientId);
        if (clientExists) {
            const consumerExists = await clientStore.isConsumer(payload.clientId);
            if (!consumerExists) {
                throw new InvalidTransaction(`consumer with clientId : ${payload.clientId} does not exists!`);
            } else {
                const power = await clientStore.consume(payload);
                if (!power) {
                    throw new InvalidTransaction(`Available consumption power is less than the required power`);
                }
                else {
                    return power;
                }
            }
        }
        else {
            throw new InvalidTransaction(`client with clientId : ${payload.clientId} does not exists!`);
        }
    }

    async handleGetDetails(context, payload) {
        const clientStore = new ClientStore(context);
        const clientExists = await clientStore.clientExists(payload.clientId);
        if (clientExists) {
            return await clientStore.getClient(payload.clientId);
        }
        else {
            throw new InvalidTransaction(`client with clientId : ${payload.clientId} does not exists!`);
        }
    }
    async apply(transactionProcessRequest, context) {
        let payload = cbor.decode(transactionProcessRequest.payload);
        switch (payload.action) {
            case 'addClient':
                return await this.handleAddClientTransaction(context, payload);
            case 'generate':
                return await this.handlepowerGenerationTransaction(context, payload);
            case 'getPower':
                return await this.handlepowerTransmissionTransaction(context, payload);
            case 'consume':
                return await this.handlepowerConsumptionTransaction(context, payload);
            case 'getClient':
                return await this.handleGetDetails(context, payload);
            default:
                throw new InvalidTransaction(
                    `Action must be addClient, generate, getPower, consume, getClient and not ${payload.action}`
                );
        }
    }
}

module.exports = smartGridHandler;


