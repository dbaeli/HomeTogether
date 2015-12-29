var _ = require('lodash');
var Reflux = require('reflux');

var colors = ["chatOdd", "chatEven", "chatAlert"];

exports = module.exports = Reflux.createStore({
  addMessage: function(messageSender, messageContent, cancellable) {
    this.messages.splice(0, 0, {
       messageContent: messageContent,
       messageColor:colors[(this.messages.length%2)],
       messageCancel:cancellable,
       messageSender:messageSender
     });
    this.trigger(this.messages);
  },
  addCraftMessage: function(messageSender, craftMessage) {
    this.addMessage(messageSender, craftMessage, false);
  },
  addCancelMessage: function(messageSender, craftMessage) {
    this.messages = _.map( this.messages, function(m) { 
      if( m.messageSender === messageSender ) {
        return { messageContent:m.messageContent,messageColor:m.messageColor,messageCancel:false,messageSender:m.messageSender };
      }
      return m;
    });
    this.addMessage(messageSender, craftMessage, true);
  },
  getMessages: function() {
    return this.messages;
  },
  getInitialState: function() {
    this.messages = [];
    this.lastUserMessage = '';
    return this.messages;
  },
  cancelMessage: function(idx) {
    this.messages[idx].messageCancel=false;
    this.trigger(this.messages);
  }
});
