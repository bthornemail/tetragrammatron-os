
inductive Realm
| local | public | ulp

inductive Ontology
| human | device | agent | service | document | constraint | environment

inductive Capability
| observe | compute | store | route | decide | attest | transform

inductive Process
| batch | stream | consensus | proof | execution | arbitration

inductive Context
| private | public | legal | scientific | religious | economic

structure AddressSchema where
  realm      : Realm
  ontology   : Ontology
  capability : Capability
  process    : Process
  context    : Context
  inst5      : UInt8
  inst6      : UInt8
  inst7      : UInt8
