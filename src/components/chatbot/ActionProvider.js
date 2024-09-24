class ActionProvider {
    constructor(createChatbotMessage, setStateFunc, createClientMessage) {
        this.createChatbotMessage = createChatbotMessage;
        this.setState = setStateFunc;
        this.createClientMessage = createClientMessage;
    }

    // "Yes" 응답을 처리하는 메서드
    handleUserMessage = (message) => {

        const response = this.createChatbotMessage("Yes");

        // 상태에 메시지를 추가
        this.setState((prev) => ({
            ...prev,
            messages: [...prev.messages, response],
        }));
    };
}

export default ActionProvider;