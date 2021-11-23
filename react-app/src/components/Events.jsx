import { useEventListener } from "eth-hooks/events/useEventListener";
import { Button, Col, DatePicker, Row, Table, Tag } from "antd";
import { Address } from "../components";
import { utils } from "ethers";
var moment = require('moment');


function buildPaymentInfoFromCommittedEvent(event) {
  let payer = event.args[0];
  let receiver = event.args[1];
  let lockedUntil = event.args[2].toNumber();
  let amount = utils.formatEther(event.args[3]);

  return buildPaymentEventInfo(payer, receiver, lockedUntil, amount);
}

function buildPaymentInfoFromCancelledEvent(event) {
  return buildPaymentInfoFromCommittedEvent(event);
}

function buildPaymentInfoFromClaimedEvent(event) {
  let payer = event.args[1];
  let receiver = event.args[0];
  let lockedUntil = event.args[2].toNumber();
  let amount = utils.formatEther(event.args[3]);

  return buildPaymentEventInfo(payer, receiver, lockedUntil, amount);
}

function buildPaymentEventInfo(payer, receiver, lockedUntil, amount) {
  let info = {
    payer: payer,
    receiver: receiver,
    lockedUntil: lockedUntil,
    amount: amount,
    key: payer + "_" + receiver + "_" + lockedUntil.toString() + "_" + amount,
  };

  return info;
}

export default function Events({ tx, readContracts, writeContracts, localProvider, mainnetProvider, startBlock, address}) {

  const contractName = "ProgrammablePayment";

  // 📟 Listen for broadcast events
  const commitEvents = useEventListener(readContracts, contractName, "LogPaymentCommitted", localProvider, startBlock);
  const claimedEvents = useEventListener(readContracts, contractName, "LogPaymentClaimed", localProvider, startBlock);
  const cancelledEvents = useEventListener(readContracts, contractName, "LogPaymentCancelled", localProvider, startBlock);
  let committedPayments = [];
  let receivedPayments = [];
  let claimedPayments = {};
  let cancelledPayments = {};

  claimedEvents.forEach((item) => {
    let eventInfo = buildPaymentInfoFromClaimedEvent(item);
    if (eventInfo.receiver === address || eventInfo.payer === address) {
      claimedPayments[eventInfo.key] = eventInfo;
    }
  } );

  cancelledEvents.forEach((item) => {
    let eventInfo = buildPaymentInfoFromCancelledEvent(item);
    if (eventInfo.receiver === address || eventInfo.payer === address) {
      cancelledPayments[eventInfo.key] = eventInfo;
    }
  } );

  commitEvents.forEach((item) => {
    let eventInfo = buildPaymentInfoFromCommittedEvent(item); 
    if (eventInfo.payer === address) {
      committedPayments.push(eventInfo);
    } else if (eventInfo.receiver === address) {
      if(!(eventInfo.key in cancelledPayments || eventInfo.key in claimedPayments)) {
        receivedPayments.push(eventInfo);
      }
    }
  } );

  const receivedColumns = [
    {
      title: 'Payer',
      dataIndex: 'payer',
      key: 'payer',
      render: (payer) => (<Address address={payer} ensProvider={mainnetProvider} fontSize={16} />)
    },
    {
      title: 'Receiver',
      dataIndex: 'receiver',
      key: 'receiver',
      render: (receiver) => (<Address address={receiver} ensProvider={mainnetProvider} fontSize={16} />)
    },
    {
      title: 'Lock Time',
      dataIndex: 'lockedUntil',
      key: 'lockedUntil',
      render: (timestamp) => (<DatePicker value={moment(timestamp * 1000)} showTime="true" disabled={true}/>),
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.lockedUntil - b.lockedUntil,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount'
    },
  ];

  const paymentsColumns = receivedColumns.concat({
    title: '',
    render: (paymentEvent) => {
      if (paymentEvent.key in cancelledPayments) {
        return (<Tag color="volcano" key="cancelled">cancelled</Tag>)
      } else if (paymentEvent.key in claimedPayments) {
        return (<Tag color="green" key="claimed">claimed</Tag>)
      } else {
          return (
            <Button
              onClick={async () => {
                const result = tx(writeContracts.ProgrammablePayment.cancelCommittedPayment(paymentEvent.receiver, paymentEvent.lockedUntil, utils.parseEther(paymentEvent.amount)));
                console.log("awaiting metamask/web3 confirm result...", result);
                console.log(await result);
              }}
            >
              Cancel
            </Button>)
      }
    }
  })

  return (
    <Row>
      <Col span={12}>
        <div style={{ border: "1px solid #cccccc", margin: "auto", marginLeft: 32, marginRight: 16, marginTop: 32, padding: 16 }}>
          <h2>Committed Payments</h2>
          <Table dataSource={committedPayments} columns={paymentsColumns}/>
        </div>
      </Col>
      <Col span={12}>
        <div style={{ border: "1px solid #cccccc", margin: "auto", marginLeft: 16, marginRight: 32, marginTop: 32, padding: 16 }}>
          <h2>Received Payments</h2>
          <Table dataSource={receivedPayments} columns={receivedColumns}/>
        </div>
      </Col>
    </Row>
  );
}
