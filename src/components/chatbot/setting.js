import { createChatBotMessage } from "react-chatbot-kit";

const setting = {
    initialMessages: [
        createChatBotMessage(
            "안녕하세요! 궁금한 내용을 입력해주세요."
        ),
    ],
};

export default setting;