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
            console.log("client Id : "+payload.clientId);
            throw new InvalidTransaction(`client  ${payload.clientId} already exists!`);
        } else {
            return await clientStore.addClient(payload);
        }
    }

    async handlepowerGenerationTransaction(context, payload) {
        const clientStore = new ClientStore(context);
        const clientExists = await clientStore.clientExists(payload.clientId);
        if(clientExists){
            const producerExists = await clientStore.isProducer(payload.clientId);
            if (!producerExists) {
                throw new InvalidTransaction(`producer  ${payload.clientId} does not exists!`);
            } else {
                return await clientStore.generate(payload);
            }
        }
        else
        {
            throw new InvalidTransaction(`client  ${payload.clientId} does not exists!`);
        }
    }


    async handlepowerTransmissionTransaction(context, payload) {
        const clientStore = new ClientStore(context);
        const clientExists = await clientStore.clientExists(payload.clientId);
        if(clientExists)
        {
            const consumerExists = await clientStore.isProducer(payload.clientId);
            const producerExists= await clientStore.isConsumer(payload.producerId);
            if (!producerExists && !consumerExists) {
                    throw new InvalidTransaction(`producer ${payload.producerId} or consumer ${payload.clientId} does not exists!`);
            } else {
                    return await clientStore.getPower(payload);
            }
        }
        else
        {
            throw new InvalidTransaction(`client  ${payload.clientId} does not exists!`);
        }
    }

    async handlepowerConsumptionTransaction(context, payload) {
        const clientStore = new ClientStore(context);
        const clientExists = await clientStore.clientExists(payload.clientId);
        if(clientExists){
            const consumerExists = await clientStore.isConsumer(payload.clientId);
            if (!consumerExists) {
                throw new InvalidTransaction(`consumer  ${payload.clientId} does not exists!`);
            } else {
                return await clientStore.consume(payload);
            }
        }
        else
        {
            throw new InvalidTransaction(`client  ${payload.clientId} does not exists!`);
        }
    }

    async handleGetDetails(context,payload){
        const clientStore=new ClientStore(context);
        const clientExists=await clientStore.clientExists(payload.clientId);
        if(clientExists){
            return await clientStore.getClient(payload.clientId);
        }
        else
        {
            throw new InvalidTransaction(`client  ${payload.clientId} does not exists!`);
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
                return await this.handlepowerConsumptionTransaction(context,payload);
            case 'getClient':
                return await this.handleGetDetails(context,payload);
            default:
                throw new InvalidTransaction(
                    `Action must be add voter, add party,  add vote, and not ${payload.action}`
                );
        }
    }
}

module.exports = smartGridHandler;


