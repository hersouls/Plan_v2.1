import {
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  setLogLevel,
  updateDoc,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

let testEnv: RulesTestEnvironment;

const PROJECT_ID = 'demo-test';

const readRules = () => {
  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  return fs.readFileSync(rulesPath, 'utf8');
};

beforeAll(async () => {
  setLogLevel('error');
  const hostPort = (
    process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080'
  ).split(':');
  const host = hostPort[0];
  const port = Number(hostPort[1] || 8080);
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host,
      port,
      rules: readRules(),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Firestore Rules - Points and Group Membership', () => {
  const groupId = 'group-1';
  const ownerId = 'owner-uid';
  const memberId = 'member-uid';
  const outsiderId = 'outsider-uid';

  async function seedGroup() {
    const admin = testEnv.unauthenticatedContext().firestore();
    await setDoc(doc(admin, `groups/${groupId}`), {
      id: groupId,
      name: 'Test Group',
      ownerId,
      settings: { allowMembersToInvite: true },
    });
    await setDoc(doc(admin, `groups/${groupId}/members/${ownerId}`), {
      role: 'owner',
    });
    await setDoc(doc(admin, `groups/${groupId}/members/${memberId}`), {
      role: 'member',
    });
  }

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await seedGroup();
    });
  });

  test('group members can read pointHistory in their group; outsiders cannot', async () => {
    const memberDb = testEnv.authenticatedContext(memberId).firestore();
    const outsiderDb = testEnv.authenticatedContext(outsiderId).firestore();
    const admin = testEnv.unauthenticatedContext().firestore();

    const historyRef = doc(admin, `pointHistory/ph-1`);
    await setDoc(historyRef, {
      id: 'ph-1',
      userId: memberId,
      groupId,
      amount: 10,
      type: 'earned',
      createdAt: { seconds: 0, nanoseconds: 0 },
    });

    await assertSucceeds(getDoc(doc(memberDb, `pointHistory/ph-1`)));
    await assertFails(getDoc(doc(outsiderDb, `pointHistory/ph-1`)));
  });

  test('only owner can update/delete pointHistory; member cannot', async () => {
    const ownerDb = testEnv.authenticatedContext(ownerId).firestore();
    const memberDb = testEnv.authenticatedContext(memberId).firestore();
    const admin = testEnv.unauthenticatedContext().firestore();
    const ref = doc(admin, `pointHistory/ph-2`);
    await setDoc(ref, {
      id: 'ph-2',
      userId: memberId,
      groupId,
      amount: 5,
      type: 'earned',
    });

    await assertFails(
      updateDoc(doc(memberDb, `pointHistory/ph-2`), { amount: 6 })
    );
    await assertSucceeds(
      updateDoc(doc(ownerDb, `pointHistory/ph-2`), { amount: 6 })
    );
    await assertSucceeds(deleteDoc(doc(ownerDb, `pointHistory/ph-2`)));
  });

  test('create pointHistory: user self-create or group owner allowed', async () => {
    const ownerDb = testEnv.authenticatedContext(ownerId).firestore();
    const memberDb = testEnv.authenticatedContext(memberId).firestore();
    const outsiderDb = testEnv.authenticatedContext(outsiderId).firestore();

    await assertSucceeds(
      addDoc(collection(memberDb, 'pointHistory'), {
        userId: memberId,
        groupId,
        amount: 3,
        type: 'bonus',
      })
    );
    await assertSucceeds(
      addDoc(collection(ownerDb, 'pointHistory'), {
        userId: memberId,
        groupId,
        amount: 3,
        type: 'bonus',
      })
    );
    await assertFails(
      addDoc(collection(outsiderDb, 'pointHistory'), {
        userId: memberId,
        groupId,
        amount: 3,
        type: 'bonus',
      })
    );
  });

  test('pointRules: read allowed to members; write only by owner', async () => {
    const ownerDb = testEnv.authenticatedContext(ownerId).firestore();
    const memberDb = testEnv.authenticatedContext(memberId).firestore();
    const outsiderDb = testEnv.authenticatedContext(outsiderId).firestore();

    // Read
    await assertSucceeds(getDoc(doc(memberDb, `pointRules/r-1`)));
    // Write
    await assertSucceeds(
      setDoc(doc(ownerDb, `pointRules/r-1`), { id: 'r-1', groupId })
    );
    await assertFails(
      setDoc(doc(memberDb, `pointRules/r-2`), { id: 'r-2', groupId })
    );
    await assertFails(
      setDoc(doc(outsiderDb, `pointRules/r-3`), { id: 'r-3', groupId })
    );
  });
});
