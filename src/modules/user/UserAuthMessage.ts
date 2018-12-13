import {IMessage, MessageType} from "@typexs/ng-base";

export class UserAuthMessage implements IMessage {
  content: any;
  topic: any;
  type: MessageType;
}
