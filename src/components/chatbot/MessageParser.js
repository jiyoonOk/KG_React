class MessageParser {
    constructor(actionProvider, state) {
        this.actionProvider = actionProvider;
        this.state = state;
    }

    parse(message) {
        console.log(message);

        // 입력 메시지를 처리하고 ActionProvider의 method를 호출
        this.actionProvider.handleUserMessage(message);
    }
}

export default MessageParser;