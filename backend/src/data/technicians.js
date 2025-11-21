const technicians = [
  { id: "tech1", name: "Ravi Kumar", phone: "+91 90000 00001" },
  { id: "tech2", name: "Anjali Sharma", phone: "+91 90000 00002" },
  { id: "tech3", name: "Suresh Yadav", phone: "+91 90000 00003" },
];

let cursor = 0;

// Round-robin assignment - stands in for real zone/route-based dispatch.
export function assignTechnician() {
  const tech = technicians[cursor % technicians.length];
  cursor += 1;
  return tech;
}
