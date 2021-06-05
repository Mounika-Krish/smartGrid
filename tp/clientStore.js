var { _hash } = require('./lib');
var { TP_NAMESPACE } = require('./constants');
var serialise = require('./serialiser');

class ClientStore {
    constructor(context) {
        this.context = context;
        this.timeout = 500;
    }
    
    async addClient(client) {
        const address = clientAddress(client.clientId);
        let clientInfo = { 
            clientId: client.clientId, 
            name:client.name,
            isConsumer: client.isConsumer,
            isProducer: client.isProducer,
            availableConsumerPower: 0,
            totConsumedPower: 0,
            availableProducerPower: 0,
            totGeneratedPower: 0,
            accBalance:10
        };
        let serialised = serialise(clientInfo);
        let data = Buffer.from(serialised);
        return await this.context.setState({ [address]: data }, this.timeout);
    }

    async clientExists(clientId) {
        const address = clientAddress(clientId);
        let clientInfo = await this.context.getState([address], this.timeout);
        const client = clientInfo[address][0];
        if (client == undefined || client == null) {
            return false;
        } else {
            return true;
        }
    }

    async getClient(clientId) {
        const address = clientAddress(clientId);
        let clientInfo = await this.context.getState([address], this.timeout);
        const clientData = clientInfo[address];
        if (Buffer.isBuffer(clientData)) {
            const json = clientData.toString();
            const client = JSON.parse(json);
            return client;
        } else {
            return undefined;
        }
    }

    async isProducer(clientId) {
        const address = clientAddress(clientId);
        let clientInfo = await this.context.getState([address], this.timeout);
        const client = clientInfo[address][0];
        if (client == undefined || client == null) {
            return false;
        } else {
            if(client.isProducer===true)
            {
                return true;
            }
            return false;
        }
    }

    async isConsumer(clientId) {
        const address = clientAddress(clientId);
        let clientInfo = await this.context.getState([address], this.timeout);
        const client = clientInfo[address][0];
        if (client == undefined || client == null) {
            return false;
        } else {
            if(client.isConsumer===true)
            {
                return true;
            }
            return false;
        }
    }

    async generate(client){
        const address = clientAddress(client.clientId);
        let clientInfo = await this.context.getState([address], this.timeout);
        const clientData = clientInfo[address];
        if (Buffer.isBuffer(clientData)) {
            const json = clientData.toString();
            const Client = JSON.parse(json);
            Client.availableProducerPower+=client.val;
            Client.totGeneratedPower+=client.val
            let serialised = serialise(Client);
            let data = Buffer.from(serialised);
            return await this.context.setState({ [address]: data }, this.timeout);
        } else {
            return undefined;
        }
    }

    async getPower(client){
        const address = clientAddress(client.clientId);
        let clientInfo = await this.context.getState([address], this.timeout);

        const produceradd=clientAddress(client.producerId);
        let producerInfo=await this.context.getState([produceradd],this.timeout);

        const clientData = clientInfo[address];
        const producerData=producerInfo[produceradd];
        if (Buffer.isBuffer(clientData)&&Buffer.isBuffer(producerData)) {
            const jsonc = clientData.toString();
            const Client = JSON.parse(jsonc);

            const jsonp=producerData.toString();
            const producer=JSON.parse(jsonp);

            producer.availableProducerPower-=client.val;
            Client.availableConsumerPower+=client.val

            let serialisedc = serialise(Client);
            let datac = Buffer.from(serialisedc);

            let serialisedP=serialise(producer);
            let datap=Buffer.from(serialisedP);

            return await this.context.setState({ [address]: datac }, this.timeout)&& await this.context.setState({[produceradd]:datap},this.timeout);
        } else {
            return undefined;
        }
    }

    async consume(client){
        const address = clientAddress(client.clientId);
        let clientInfo = await this.context.getState([address], this.timeout);
        const clientData = clientInfo[address];
        if (Buffer.isBuffer(clientData)) {
            const json = clientData.toString();
            const Client = JSON.parse(json);
            Client.availableConsumerPower-=client.val;
            Client.totConsumedPower+=client.val;
            let serialised = serialise(Client);
            let data = Buffer.from(serialised);
            return await this.context.setState({ [address]: data }, this.timeout);
        } else {
            return undefined;
        }
    }
}


const clientAddress = clientId => TP_NAMESPACE + '01' + _hash(clientId).substring(0, 62);

module.exports = ClientStore;
