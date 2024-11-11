import { useState } from 'react';
import { Box, Dropdown, Input, Section, TextArea } from 'tgui-core/components';
import { BooleanLike } from 'tgui-core/react';

import { useBackend } from '../backend';
import { Button } from '../components/Button';
import { Window } from '../layouts';

type AdminPDAData = {
  users: { [ref: string]: PDAUser };
};

type PDAUser = {
  ref: string;
  username: string;
  invisible: BooleanLike;
};

export const AdminPDA = () => {
  return (
    <Window title="Send PDA Message" width={300} height={575} theme="admin">
      <Window.Content>
        <ReceiverChoice />
        <SenderInfo />
        <MessageInput />
      </Window.Content>
    </Window>
  );
};

const ReceiverChoice = () => {
  const { data } = useBackend<AdminPDAData>();
  const { users } = data;
  const receivers = Array.from(Object.values(users));

  const [user, setUser] = useState('');
  const [spam, setSpam] = useState(false);
  const [showInvisible, setShowInvisible] = useState(false);

  return (
    <Section title="To Who?" textAlign="center">
      <Box>
        <Dropdown
          disabled={spam}
          selected={user}
          displayText={users[user]?.username}
          placeholder="Pick a user..."
          options={receivers
            .filter((rcvr) => showInvisible || !rcvr.invisible)
            .map((rcvr) => ({
              displayText: rcvr.username,
              value: rcvr.ref,
            }))}
          width="275px"
          mb={1}
          onSelected={(value) => {
            setUser(value);
          }}
        />
      </Box>
      <Box>
        <Button.Checkbox
          checked={showInvisible}
          fluid
          onClick={() => setShowInvisible(!showInvisible)}
        >
          Include invisible?
        </Button.Checkbox>
        <Button.Checkbox checked={spam} fluid onClick={() => setSpam(!spam)}>
          Should it be sent to everyone?
        </Button.Checkbox>
      </Box>
    </Section>
  );
};

const SenderInfo = () => {
  const [name, setName] = useState('');
  const [job, setJob] = useState('');

  return (
    <Section title="From Who?" textAlign="center">
      <Box fontSize="14px">
        <Input
          placeholder="Sender name..."
          fluid
          onChange={(e, value) => {
            setName(value);
          }}
        />
      </Box>
      <Box fontSize="14px" pt="10px">
        <Input
          placeholder="Sender's job..."
          fluid
          onChange={(e, value) => {
            setJob(value);
          }}
        />
      </Box>
    </Section>
  );
};

const MessageInput = () => {
  const { act } = useBackend();

  const [user, setUser] = useState('');
  const [name, setName] = useState('');
  const [job, setJob] = useState('');
  const [messageText, setMessageText] = useState('');
  const [spam, setSpam] = useState(false);
  const [force, setForce] = useState(false);
  const [showInvisible, setShowInvisible] = useState(false);

  const tooltipText = (
    name: string,
    job: string,
    message: string,
    target: boolean,
  ): string => {
    let reasonList: string[] = [];
    if (!target) reasonList.push('target');
    if (!name) reasonList.push('name');
    if (!job) reasonList.push('job');
    if (!message) reasonList.push('message text');
    return reasonList.join(', ');
  };

  const blocked = !name || !job || !messageText;

  return (
    <Section title="Message" textAlign="center">
      <Box>
        <TextArea
          placeholder="Type the message you want to send..."
          height="200px"
          mb={1}
          onChange={(e, value) => {
            setMessageText(value);
          }}
        />
      </Box>
      <Box>
        <Button.Checkbox
          fluid
          checked={force}
          tooltip={
            'This will immediately broadcast the message, bypassing telecomms altogether.'
          }
          onClick={() => setForce(!force)}
        >
          Force send the message?
        </Button.Checkbox>
        <Button
          tooltip={
            blocked
              ? 'Fill in the following lines: ' +
                tooltipText(name, job, messageText, spam || !!user)
              : 'Send message to user(s)'
          }
          fluid
          disabled={blocked}
          icon="envelope-open-text"
          onClick={() =>
            act('sendMessage', {
              name: name,
              job: job,
              ref: user,
              message: messageText,
              spam: spam,
              include_invisible: showInvisible,
              force: force,
            })
          }
        >
          Send Message
        </Button>
      </Box>
    </Section>
  );
};
