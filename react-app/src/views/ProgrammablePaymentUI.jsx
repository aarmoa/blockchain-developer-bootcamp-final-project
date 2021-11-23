import { utils } from "ethers";
import { Button, Col, DatePicker, Divider, Row } from "antd";
import React, { useState } from "react";
import { AddressInput, EtherInput, Events } from "../components";

export default function ExampleUI({
  address,
  mainnetProvider,
  localProvider,
  price,
  tx,
  readContracts,
  writeContracts,
}) {
  const [paymentReceiver, setPaymentReceiver] = useState();
  const [lockTime, setLockTime] = useState();
  const [paymentAmount, setPaymentAmount] = useState();

  return (
    <div>
      {/*
        ⚙️ Here is an example UI that displays and sets the purpose in your smart contract:
      */}
      <div style={{ border: "1px solid #cccccc", padding: 16, width: "80%", margin: "auto", marginTop: 64 }}>
        <Row>
          <Col span={12} offset={6}><h2>Commit Payment</h2></Col>
        </Row>
        <Row>
          <Col span={6}>Pay to:</Col>
          <Col span={18}>
            <AddressInput
              autoFocus
              placeholder="Enter address"
              value={paymentReceiver}
              onChange={setPaymentReceiver}
            />
          </Col>
        </Row>
        <Row>
          <Col span={6}>Lock until:</Col>
          <Col span={18}>
            <DatePicker value={lockTime} showTime="true" onChange={setLockTime} style={{width: "100%"}}/>
          </Col>
        </Row>
        <Row>
          <Col span={6}>Amount:</Col>
          <Col span={18}>
            <EtherInput
              price={price}
              value={paymentAmount}
              placeholder="Enter amount"
              onChange={setPaymentAmount}
            />
          </Col>
        </Row>
        <Row>
          <Col span={12} offset={6}>
            <Button
              style={{ marginTop: 8 }}
              onClick={async () => {
                const result = tx(writeContracts.ProgrammablePayment.commitPayment(paymentReceiver, lockTime.unix(), {value: utils.parseEther(paymentAmount)}));
                console.log("awaiting metamask/web3 confirm result...", result);
                console.log(await result);
              }}
            >
              Commit Payment
            </Button>
          </Col>
        </Row>
        <Divider />
        <Row>
          <Col span={12} offset={6}><h2>Claim Payments</h2></Col>
        </Row>
        <Row>
          <Col span={12} offset={6}>
            <Button
              style={{ marginTop: 8, marginBottom: 8 }}
              onClick={async () => {
                const result = tx(writeContracts.ProgrammablePayment.claimAvailablePayments());
                console.log("awaiting metamask/web3 confirm result...", result);
                console.log(await result);
              }}
            >
              Claim Available Payments
            </Button>
          </Col>
        </Row>
        
      </div>

      <Events
        tx={tx}
        readContracts={readContracts}
        writeContracts={writeContracts}
        localProvider={localProvider}
        mainnetProvider={mainnetProvider}
        startBlock={1}
        address={address}
      />
    </div>
  );
}
