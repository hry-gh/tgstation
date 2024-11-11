import { map, sortBy } from 'common/collections';
import { flow } from 'common/fp';
import { useState } from 'react';
import {
  Box,
  Button,
  Dimmer,
  Icon,
  Section,
  Stack,
  Table,
  Tabs,
} from 'tgui-core/components';
import { BooleanLike } from 'tgui-core/react';

import { useBackend } from '../backend';
import { Window } from '../layouts';
import { AreaCharge, powerRank } from './PowerMonitor';

type ApcControlData = {
  auth_id: string;
  authenticated: BooleanLike;
  emagged: BooleanLike;
  logging: BooleanLike;
  restoring: BooleanLike;

  logs: { entry: string }[];

  apcs: ApcData[];
};

type ApcData = {
  name: string;
  operating: BooleanLike;
  charge: number | 'NOCELL';
  load: string;
  charging: 0 | 1 | 2;
  chargeMode: BooleanLike;
  eqp: 0 | 1 | 2 | 3;
  lgt: 0 | 1 | 2 | 3;
  env: 0 | 1 | 2 | 3;
  responds: BooleanLike;
  ref: string;
};

export const ApcControl = () => {
  const { data } = useBackend<ApcControlData>();
  return (
    <Window title="APC Controller" width={550} height={500}>
      <Window.Content>
        {data.authenticated === 1 && <ApcLoggedIn />}
        {data.authenticated === 0 && <ApcLoggedOut />}
      </Window.Content>
    </Window>
  );
};

const ApcLoggedOut = () => {
  const { act, data } = useBackend<ApcControlData>();
  const { emagged } = data;
  const text = emagged === 1 ? 'Open' : 'Log In';
  return (
    <Section>
      <Button
        icon="sign-in-alt"
        color={emagged === 1 ? '' : 'good'}
        content={text}
        fluid
        onClick={() => act('log-in')}
      />
    </Section>
  );
};

const ApcLoggedIn = () => {
  const { act, data } = useBackend<ApcControlData>();
  const { restoring } = data;
  const [tabIndex, setTabIndex] = useState(1);

  const [sortByField, setSortByField] = useState<string | boolean>('name');

  return (
    <Box>
      <Tabs>
        <Tabs.Tab
          selected={tabIndex === 1}
          onClick={() => {
            setTabIndex(1);
            act('check-apcs');
          }}
        >
          APC Control Panel
        </Tabs.Tab>
        <Tabs.Tab
          selected={tabIndex === 2}
          onClick={() => {
            setTabIndex(2);
            act('check-logs');
          }}
        >
          Log View Panel
        </Tabs.Tab>
      </Tabs>
      {restoring === 1 && (
        <Dimmer fontSize="32px">
          <Icon name="cog" spin />
          {' Resetting...'}
        </Dimmer>
      )}
      {tabIndex === 1 && (
        <Stack vertical>
          <Stack.Item>
            <Section>
              <ControlPanel
                sortByField={sortByField}
                setSortByField={setSortByField}
              />
            </Section>
          </Stack.Item>
          <Stack.Item>
            <Section scrollable>
              <ApcControlScene sortByField={sortByField} />
            </Section>
          </Stack.Item>
        </Stack>
      )}
      {tabIndex === 2 && (
        <Section scrollable>
          <Box height={34}>
            <LogPanel />
          </Box>
        </Section>
      )}
    </Box>
  );
};

const ControlPanel = (props: {
  sortByField: string | boolean;
  setSortByField: (_: string | boolean) => void;
}) => {
  const { act, data } = useBackend<ApcControlData>();

  const { sortByField, setSortByField } = props;

  const { emagged, logging } = data;
  return (
    <Stack justify="space-between">
      <Stack.Item>
        <Box inline mr={2} color="label">
          Sort by:
        </Box>
        <Button.Checkbox
          checked={sortByField === 'name'}
          content="Name"
          onClick={() => setSortByField(sortByField !== 'name' && 'name')}
        />
        <Button.Checkbox
          checked={sortByField === 'charge'}
          content="Charge"
          onClick={() => setSortByField(sortByField !== 'charge' && 'charge')}
        />
        <Button.Checkbox
          checked={sortByField === 'draw'}
          content="Draw"
          onClick={() => setSortByField(sortByField !== 'draw' && 'draw')}
        />
      </Stack.Item>
      <Stack.Item grow={1} />
      <Stack.Item>
        {emagged === 1 && (
          <>
            <Button
              color={logging === 1 ? 'bad' : 'good'}
              content={logging === 1 ? 'Stop Logging' : 'Restore Logging'}
              onClick={() => act('toggle-logs')}
            />
            <Button
              content="Reset Console"
              onClick={() => act('restore-console')}
            />
          </>
        )}
        <Button
          icon="sign-out-alt"
          color="bad"
          content="Log Out"
          onClick={() => act('log-out')}
        />
      </Stack.Item>
    </Stack>
  );
};

const ApcControlScene = (props: { sortByField: string | boolean }) => {
  const { data, act } = useBackend<ApcControlData>();

  const { sortByField } = props;

  const apcs = flow([
    (apcs) =>
      map(apcs, (apc: ApcData, i) => ({
        ...apc,
        // Generate a unique id
        id: apc.name + i,
      })),
    (apcs) =>
      sortByField === 'name' && sortBy(apcs, (apc: ApcData) => apc.name),
    (apcs) =>
      sortByField === 'charge' && sortBy(apcs, (apc: ApcData) => -apc.charge),
    (apcs) =>
      sortByField === 'draw' &&
      sortBy(
        apcs,
        (apc: ApcData) => -powerRank(apc.load),
        (apc: ApcData) => -parseFloat(apc.load),
      ),
  ])(data.apcs);
  return (
    <Box height={30}>
      <Table>
        <Table.Row header>
          <Table.Cell>On/Off</Table.Cell>
          <Table.Cell>Area</Table.Cell>
          <Table.Cell collapsing>Charge</Table.Cell>
          <Table.Cell collapsing textAlign="right">
            Draw
          </Table.Cell>
          <Table.Cell collapsing title="Equipment">
            Eqp
          </Table.Cell>
          <Table.Cell collapsing title="Lighting">
            Lgt
          </Table.Cell>
          <Table.Cell collapsing title="Environment">
            Env
          </Table.Cell>
        </Table.Row>
        {apcs.map((apc, i) => (
          <tr key={apc.id} className="Table__row  candystripe">
            <td>
              <Button
                icon={apc.operating ? 'power-off' : 'times'}
                color={apc.operating ? 'good' : 'bad'}
                onClick={() =>
                  act('breaker', {
                    ref: apc.ref,
                  })
                }
              />
            </td>
            <td>
              <Button
                onClick={() =>
                  act('access-apc', {
                    ref: apc.ref,
                  })
                }
              >
                {apc.name}
              </Button>
            </td>
            <td className="Table__cell text-right text-nowrap">
              <AreaCharge charging={apc.charging} charge={apc.charge} />
            </td>
            <td className="Table__cell text-right text-nowrap">{apc.load}</td>
            <td className="Table__cell text-center text-nowrap">
              <AreaStatusColorButton
                target="equipment"
                status={apc.eqp}
                apc={apc}
                act={act}
              />
            </td>
            <td className="Table__cell text-center text-nowrap">
              <AreaStatusColorButton
                target="lighting"
                status={apc.lgt}
                apc={apc}
                act={act}
              />
            </td>
            <td className="Table__cell text-center text-nowrap">
              <AreaStatusColorButton
                target="environ"
                status={apc.env}
                apc={apc}
                act={act}
              />
            </td>
          </tr>
        ))}
      </Table>
    </Box>
  );
};

const LogPanel = () => {
  const { data } = useBackend<ApcControlData>();

  const logs = map(data.logs, (line, i) => ({
    ...line,
    // Generate a unique id
    id: line.entry + i,
  })).reverse();
  return (
    <Box m={-0.5}>
      {logs.map((line) => (
        <Box p={0.5} key={line.id} className="candystripe" bold>
          {line.entry}
        </Box>
      ))}
    </Box>
  );
};

const AreaStatusColorButton = (props) => {
  const { target, status, apc, act } = props;
  const power = Boolean(status & 2);
  const mode = Boolean(status & 1);
  return (
    <Button
      icon={mode ? 'sync' : 'power-off'}
      color={power ? 'good' : 'bad'}
      onClick={() =>
        act('toggle-minor', {
          type: target,
          value: statusChange(status),
          ref: apc.ref,
        })
      }
    />
  );
};

const statusChange = (status) => {
  // mode flip power flip both flip
  // 0, 2, 3
  return status === 0 ? 2 : status === 2 ? 3 : 0;
};
