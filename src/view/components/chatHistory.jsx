import React from 'react';
import _ from 'lodash';
var Reflux = require('reflux');
import chatHistoryStore from './chatHistoryStore.js';
import { Button } from 'react-bootstrap';

var ChatMessage = React.createClass({
  cancelLast: function() {
    console.log( 'Cancelling' );
    chatHistoryStore.cancelMessage( this.props.idx );
    this.props.instance.updateAgentKnowledge( this.props.messageSender, {cancel:true},'merge')
    .catch((err) => {
      console.log(err);
    });
  },  
  render: function() {
    return (
      <div className={this.props.messageColor}>
        <small className='left clearfix'>
          <span>{this.props.messageContent}
          {this.props.messageCancel ? 
            <Button style={{float:'right', lineHeight:1, fontWeight:900}} bsStyle='primary' bsSize='xsmall' onClick={this.cancelLast}>-</Button>:
            void 0
          }
          </span>
        </small>
      </div>
    );
  }
});

exports = module.exports = React.createClass({
  mixins: [Reflux.connect(chatHistoryStore, 'messages')],
  render: function() {
    return (
      <div>
        <div className='panel panel-primary' style={{height: '180px', overflowY: 'auto', overflowX: 'hidden'}}>
          <span className='chat'>
            {
              this.state.messages.length == 0 ? (
                <h3><em>{this.props.placeholder}</em></h3>
              ) : _.map(this.state.messages, (msg,idx) => (
                <ChatMessage
                  key={idx}
                  idx={idx}
                  instance={this.props.instance}
                  messageContent={msg.messageContent}
                  messageColor={msg.messageColor}
                  messageCancel={msg.messageCancel}
                  messageSender={msg.messageSender}/>
                )
              )
            }
          </span>
        </div>
      </div>
    );
  }
});
