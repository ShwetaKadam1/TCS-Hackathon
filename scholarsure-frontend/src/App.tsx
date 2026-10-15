import { useMemo, useState, type FormEvent } from 'react';
import { screen, type AppRecord, type Recommendation } from './engine';

type Role = 'Applicant' | 'Evaluator' | 'Admin';
type DocKey = 'marksheet' | 'income' | 'enrollment';

const demo: AppRecord[] = [
  {
    id: 'APP-001',
    name: 'Aarav Sharma',
    email: 'aarav.demo@example.com',
    course: 'B.Com · Year 2',
    institution: 'Mumbai City College',
    marks: 90,
    income: 150000,
    enrolled: true,
    deadlineMet: true,
    documents: { marksheet: true, income: true, enrollment: true },
    verified: { marksheet: true, income: true, enrollment: true },
    recommendation: 'RECOMMEND_APPROVE',
    reasons: [],
    decision: 'PENDING',
    decisionReason: ''
  },
  {
    id: 'APP-002',
    name: 'Priya Patil',
    email: 'priya.demo@example.com',
    course: 'B.Sc Computer Science · Year 1',
    institution: 'Western Institute',
    marks: 45,
    income: 150000,
    enrolled: true,
    deadlineMet: true,
    documents: { marksheet: true, income: true, enrollment: true },
    verified: { marksheet: true, income: true, enrollment: true },
    recommendation: 'RECOMMEND_REJECT',
    reasons: [],
    decision: 'PENDING',
    decisionReason: ''
  },
  {
    id: 'APP-003',
    name: 'Imran Shaikh',
    email: 'imran.demo@example.com',
    course: 'B.A. Economics · Year 1',
    institution: 'Harbour Arts College',
    marks: 85,
    income: 180000,
    enrolled: true,
    deadlineMet: true,
    documents: { marksheet: true, income: false, enrollment: true },
    verified: { marksheet: true, income: false, enrollment: true },
    recommendation: 'NEEDS_HUMAN_REVIEW',
    reasons: [],
    decision: 'PENDING',
    decisionReason: ''
  }
].map(a => ({ ...a, ...screen(a) }));

const recLabel = (r: Recommendation) =>
  r === 'RECOMMEND_APPROVE'
    ? 'Recommend approval'
    : r === 'RECOMMEND_REJECT'
      ? 'Recommend rejection'
      : 'Needs human review';

const money = (n: number) => '₹' + n.toLocaleString('en-IN');

const docs: { key: DocKey; label: string }[] = [
  { key: 'marksheet', label: 'Academic marksheet' },
  { key: 'income', label: 'Income certificate' },
  { key: 'enrollment', label: 'Enrollment certificate' }
];

export default function App() {
  const [role, setRole] = useState<Role>('Applicant');
  const [signedIn, setSignedIn] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [page, setPage] = useState('Overview');
  const [apps, setApps] = useState(demo);
  const [selectedId, setSelectedId] = useState('APP-001');
  const [query, setQuery] = useState('');
  const [decision, setDecision] = useState<
    'APPROVED' | 'REJECTED' | 'NEEDS_INFORMATION' | 'PENDING'
  >('APPROVED');
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');

  const selected = apps.find(a => a.id === selectedId) || apps[0];

  const ownApps = apps.filter(
    a => a.email.toLowerCase() === userEmail.toLowerCase()
  );

  const visible = useMemo(
    () =>
      apps.filter(a =>
        (a.name + ' ' + a.id + ' ' + a.course)
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [apps, query]
  );

  const [formFiles, setFormFiles] = useState<Record<DocKey, File | null>>({
    marksheet: null,
    income: null,
    enrollment: null
  });

  const update = (
    id: string,
    fn: (a: AppRecord) => AppRecord
  ) => setApps(old => old.map(a => (a.id === id ? fn(a) : a)));

  function authenticate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email')).trim().toLowerCase();
    const password = String(fd.get('password'));

    if (!email || !password) {
      setAuthError('Enter your email and password.');
      return;
    }

    if (authMode === 'register') {
      const name = String(fd.get('name') || '').trim();

      if (!name) {
        setAuthError('Enter your full name.');
        return;
      }

      setUserName(name);
      setRole('Applicant');
      setUserEmail(email);
      setAuthError('');
      setSignedIn(true);
      setPage('New application');
      setNotice(
        'Demo account created in this browser only. Use the application form to submit your details.'
      );
      return;
    }

    if (
      role === 'Applicant' &&
      !apps.some(a => a.email.toLowerCase() === email)
    ) {
      setAuthError(
        'No demo applicant found for this email. Choose Create account or use aarav.demo@example.com.'
      );
      return;
    }

    setUserEmail(email);
    setUserName(
      apps.find(a => a.email.toLowerCase() === email)?.name ||
        (role === 'Admin' ? 'Demo Administrator' : 'Demo Evaluator')
    );
    setAuthError('');
    setSignedIn(true);
    setPage('Overview');

    if (role === 'Applicant') {
      const own = apps.find(a => a.email.toLowerCase() === email);
      if (own) setSelectedId(own.id);
    }
  }

  function newDemo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);
    const nextNumber =
      Math.max(0, ...apps.map(a => Number(a.id.split('-')[1]) || 0)) + 1;
    const id = 'APP-' + String(nextNumber).padStart(3, '0');
    const marks = Number(fd.get('marks'));
    const income = Number(fd.get('income'));
    const filePresent = (k: DocKey) => Boolean(formFiles[k]);

    const a: AppRecord = {
      id,
      name: String(fd.get('name')).trim(),
      email: String(fd.get('email')).trim().toLowerCase(),
      course: String(fd.get('course')).trim(),
      institution: String(fd.get('institution')).trim(),
      marks,
      income,
      enrolled: fd.get('enrolled') === 'on',
      deadlineMet: true,
      documents: {
        marksheet: filePresent('marksheet'),
        income: filePresent('income'),
        enrollment: filePresent('enrollment')
      },
      verified: {
        marksheet: false,
        income: false,
        enrollment: false
      },
      recommendation: 'NEEDS_HUMAN_REVIEW',
      reasons: [],
      decision: 'PENDING',
      decisionReason: ''
    };

    const screened = { ...a, ...screen(a) };

    setApps(old => [screened, ...old]);
    setSelectedId(id);
    setUserEmail(a.email);
    setUserName(a.name);
    setPage('Applications');
    setFormFiles({
      marksheet: null,
      income: null,
      enrollment: null
    });
    setNotice(
      'Application saved in local demo state. Selected files are not uploaded to a server and will not persist after refresh.'
    );
  }

  function saveDecision() {
    if (!reason.trim()) {
      setNotice('Enter a reason before recording the final decision.');
      return;
    }

    update(selected.id, a => ({
      ...a,
      decision,
      decisionReason: reason.trim()
    }));

    setNotice('Decision recorded in local demo state only.');
    setReason('');
  }

  if (!signedIn) {
    return (
      <div className="auth-shell">
        <div className="auth-brand">
          <span className="logo">S</span>
          <div>
            <b>ScholarSure</b>
            <small>Scholarship application &amp; screening portal</small>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-heading">
            <p className="eyebrow">WELCOME TO SCHOLARSURE</p>
            <h1>
              {authMode === 'register'
                ? 'Create your applicant account'
                : 'Sign in to your portal'}
            </h1>
            <p className="sub">
              {authMode === 'register'
                ? 'Register to start a scholarship application.'
                : 'Continue to your role-specific workspace.'}
            </p>
          </div>

          {authMode === 'login' && (
            <div className="auth-role">
              <label className="field">
                Sign in as
                <select
                  value={role}
                  onChange={e => {
                    setRole(e.target.value as Role);
                    setAuthError('');
                  }}
                >
                  <option>Applicant</option>
                  <option>Evaluator</option>
                  <option>Admin</option>
                </select>
              </label>
              <p className="muted">
                Role selection is for this prototype only. Real roles must be
                assigned and verified by the backend.
              </p>
            </div>
          )}

          <form onSubmit={authenticate} className="auth-form">
            {authMode === 'register' && (
              <label className="field">
                Full name *
                <input
                  name="name"
                  required
                  placeholder="Enter your full name"
                />
              </label>
            )}

            <label className="field">
              Email address *
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                defaultValue={
                  authMode === 'login' && role === 'Applicant'
                    ? 'aarav.demo@example.com'
                    : ''
                }
              />
            </label>

            <label className="field">
              Password *
              <input
                name="password"
                type="password"
                required
                minLength={4}
                placeholder="Enter password"
              />
            </label>

            {authError && <p className="auth-error">{authError}</p>}

            <button className="primary auth-submit" type="submit">
              {authMode === 'register'
                ? 'Create applicant account'
                : 'Sign in'}
            </button>
          </form>

          {role === 'Applicant' && authMode === 'login' && (
            <div className="demo-hint">
              <b>Demo applicant</b>
              <span>aarav.demo@example.com</span>
              <small>Any password works in this local prototype.</small>
            </div>
          )}

          <div className="auth-switch">
            {authMode === 'login' ? (
              <>
                New applicant?{' '}
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setAuthError('');
                  }}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already registered?{' '}
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>

          <p className="auth-foot">
            Hackathon demo · No real accounts or passwords are stored
          </p>
        </div>
      </div>
    );
  }

  const nav =
    role === 'Applicant'
      ? ['Overview', 'My application', 'New application', 'Documents']
      : role === 'Admin'
        ? ['Overview', 'Applications', 'Scheme settings', 'Audit log']
        : ['Overview', 'Applications', 'Audit log'];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="logo">S</span>
          <div>
            <b>ScholarSure</b>
            <small>Scholarship intelligence</small>
          </div>
        </div>

        <p className="nav-label">WORKSPACE</p>

        {nav.map(x => (
          <button
            key={x}
            className={'nav ' + (page === x ? 'active' : '')}
            onClick={() => {
              setPage(x);
              if (x === 'My application' && ownApps[0]) {
                setSelectedId(ownApps[0].id);
              }
            }}
          >
            <span className="nav-icon">
              {x === 'Overview'
                ? '◫'
                : x === 'Applications' || x === 'My application'
                  ? '▤'
                  : x === 'New application'
                    ? '＋'
                    : x === 'Documents'
                      ? '▧'
                      : x === 'Scheme settings'
                        ? '⚙'
                        : '◷'}
            </span>
            <span>{x}</span>
          </button>
        ))}

        <div className="sidebar-bottom">
          <span className="dot" /> Demo mode
          <small>Local sample data only</small>
        </div>
      </aside>

      <main>
        <header>
          <span className="crumb">ScholarSure / {page}</span>

          <div className="user-menu">
            <span className="avatar">
              {(userName || 'U').slice(0, 1).toUpperCase()}
            </span>
            <span>
              <b>{userName || userEmail}</b>
              <small>{role}</small>
            </span>
            <button
              className="small"
              onClick={() => {
                setSignedIn(false);
                setAuthMode('login');
                setPage('Overview');
                setNotice('');
              }}
            >
              Sign out
            </button>
          </div>
        </header>

        <section className="content">
          {notice && (
            <div className="notice">
              {notice}
              <button onClick={() => setNotice('')}>×</button>
            </div>
          )}

          {/* APPLICANT OVERVIEW */}
          {page === 'Overview' && role === 'Applicant' && (
            <>
              <p className="eyebrow">APPLICANT PORTAL</p>
              <h1>Welcome, {userName.split(' ')[0] || 'applicant'}</h1>
              <p className="sub">
                Apply for a scholarship, submit supporting documents, and
                follow your application status.
              </p>

              {/* Missing-document warning on Applicant Overview */}
              {ownApps.some(a => !a.documents.income) && (
                <MissingDocumentNote />
              )}

              <div className="stats applicant-stats">
                <Stat label="My applications" value={ownApps.length} />
                <Stat
                  label="Awaiting review"
                  value={ownApps.filter(a => a.decision === 'PENDING').length}
                />
                <Stat
                  label="Documents needed"
                  value={ownApps.reduce(
                    (n, a) =>
                      n + Object.values(a.documents).filter(v => !v).length,
                    0
                  )}
                />
                <Stat
                  label="Decisions received"
                  value={ownApps.filter(a => a.decision !== 'PENDING').length}
                />
              </div>

              <div className="applicant-cta">
                <div>
                  <p className="eyebrow">GET STARTED</p>
                  <h2>
                    {ownApps.length
                      ? 'Continue your scholarship journey'
                      : 'Start your scholarship application'}
                  </h2>
                  <p>
                    Complete your details and attach the required documents.
                    Missing or unverified documents are sent for human review.
                  </p>
                  <button
                    className="primary"
                    onClick={() =>
                      setPage(ownApps.length ? 'My application' : 'New application')
                    }
                  >
                    {ownApps.length ? 'View my application' : 'Start application'} →
                  </button>
                </div>
                <div className="cta-icon">▤</div>
              </div>

              <h2 className="section-title">My recent applications</h2>

              {ownApps.length ? (
                <div className="panel table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Application ID</th>
                        <th>Scheme</th>
                        <th>Recommendation</th>
                        <th>Final status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {ownApps.map(a => (
                        <tr key={a.id}>
                          <td>
                            <b>{a.id}</b>
                            <small>{a.course}</small>
                          </td>
                          <td>Need-Based Undergraduate Scholarship</td>
                          <td><Pill rec={a.recommendation} /></td>
                          <td><Pill decision={a.decision} /></td>
                          <td>
                            <button
                              className="small"
                              onClick={() => {
                                setSelectedId(a.id);
                                setPage('My application');
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state panel">
                  <span>▤</span>
                  <b>No applications yet</b>
                  <p>Your submitted application will appear here.</p>
                  <button
                    className="primary"
                    onClick={() => setPage('New application')}
                  >
                    Fill application form
                  </button>
                </div>
              )}

              <div className="banner">
                <b>Your decision is made by a human evaluator</b>
                <p>
                  ScholarSure provides screening recommendations to support
                  review. It does not automatically approve or reject your
                  application.
                </p>
              </div>
            </>
          )}

          {/* EVALUATOR AND ADMIN OVERVIEW */}
          {page === 'Overview' && role !== 'Applicant' && (
            <>
              <p className="eyebrow">{role.toUpperCase()} WORKSPACE</p>
              <h1>
                {role === 'Admin' ? 'System overview' : 'Screening overview'}
              </h1>
              <p className="sub">
                Review evidence, understand recommendations, and keep decisions
                accountable.
              </p>

              <div className="stats">
                <Stat label="Applications" value={apps.length} />
                <Stat
                  label="Awaiting decision"
                  value={apps.filter(a => a.decision === 'PENDING').length}
                />
                <Stat
                  label="Needs human review"
                  value={
                    apps.filter(
                      a => a.recommendation === 'NEEDS_HUMAN_REVIEW'
                    ).length
                  }
                />
                <Stat
                  label="Approved"
                  value={apps.filter(a => a.decision === 'APPROVED').length}
                />
              </div>

              <div className="row-head">
                <h2>Recent applications</h2>
                <button className="link" onClick={() => setPage('Applications')}>
                  View all →
                </button>
              </div>

              <div className="panel table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Applicant</th>
                      <th>Marks</th>
                      <th>Recommendation</th>
                      <th>Final decision</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.slice(0, 5).map(a => (
                      <tr key={a.id}>
                        <td>
                          <b>{a.name}</b>
                          <small>{a.id} · {a.course}</small>
                        </td>
                        <td>{a.marks}%</td>
                        <td><Pill rec={a.recommendation} /></td>
                        <td><Pill decision={a.decision} /></td>
                        <td>
                          <button
                            className="small"
                            onClick={() => {
                              setSelectedId(a.id);
                              setPage('Applications');
                            }}
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="banner">
                <b>Human-in-the-loop by design</b>
                <p>
                  System recommendations are not final decisions. An authorized
                  evaluator records the final decision and reason.
                </p>
              </div>
            </>
          )}

          {/* APPLICATIONS AND APPLICATION DETAILS */}
          {(page === 'Applications' || page === 'My application') && (
            <>
              <p className="eyebrow">
                {role === 'Applicant'
                  ? 'APPLICANT PORTAL'
                  : 'APPLICATION MANAGEMENT'}
              </p>
              <h1>{role === 'Applicant' ? 'My application' : 'Applications'}</h1>
              <p className="sub">
                {role === 'Applicant'
                  ? 'Check your submitted details, document status, and application progress.'
                  : 'Select a record to inspect its evidence and recommendation.'}
              </p>

              {role !== 'Applicant' && (
                <div className="panel list list-wide">
                  <input
                    className="search"
                    placeholder="Search applicant or ID"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                  />

                  {visible.map(a => (
                    <button
                      key={a.id}
                      className={
                        'list-item ' + (a.id === selectedId ? 'chosen' : '')
                      }
                      onClick={() => setSelectedId(a.id)}
                    >
                      <b>{a.name}</b>
                      <small>{a.id} · {a.course}</small>
                      <div><Pill rec={a.recommendation} /></div>
                    </button>
                  ))}
                </div>
              )}

              {(role !== 'Applicant' || ownApps.length > 0) && (
                <div className="panel detail application-detail">
                  <div className="detail-top">
                    <div>
                      <p className="eyebrow">{selected.id}</p>
                      <h2>{selected.name}</h2>
                      <small>{selected.email}</small>
                    </div>
                    <Pill decision={selected.decision} />
                  </div>

                  <h3>Application information</h3>
                  <div className="facts">
                    <Fact label="Course" value={selected.course} />
                    <Fact label="Institution" value={selected.institution} />
                    <Fact label="Academic score" value={selected.marks + '%'} />
                    <Fact
                      label="Annual family income"
                      value={money(selected.income)}
                    />
                  </div>

                  <h3>
                    Required documents <small>Uploaded ≠ verified</small>
                  </h3>

                  {/* Missing-document warning for Applicant and Evaluator */}
                  {!selected.documents.income && <MissingDocumentNote />}

                  {docs.map(({ key, label }) => (
                    <div className="doc" key={key}>
                      <span>
                        <b>{label}</b>
                        <small>
                          {!selected.documents[key]
                            ? 'Missing'
                            : selected.verified[key]
                              ? 'Verified by evaluator in demo'
                              : 'Submitted · awaiting verification'}
                        </small>
                      </span>

                      {role !== 'Applicant' && selected.documents[key] && (
                        <button
                          className="small"
                          onClick={() => {
                            update(selected.id, a => {
                              const verified = {
                                ...a.verified,
                                [key]: !a.verified[key]
                              };
                              return {
                                ...a,
                                verified,
                                ...screen({ ...a, verified })
                              };
                            });
                            setNotice(
                              'Demo verification changed locally only.'
                            );
                          }}
                        >
                          {selected.verified[key] ? 'Undo verify' : 'Mark verified'}
                        </button>
                      )}
                    </div>
                  ))}

                  <div className="recommendation">
                    <b>
                      System recommendation · {recLabel(selected.recommendation)}
                    </b>
                    {selected.reasons.map(x => <p key={x}>{x}</p>)}
                    <small>
                      This is a rule-based demo recommendation, not a
                      probability or a final decision.
                    </small>
                  </div>

                  {role !== 'Applicant' && (
                    <>
                      <h3>Eligibility checks</h3>

                      {[
                        {
                          label: 'Academic minimum (60%)',
                          pass: selected.marks >= 60,
                          detail:
                            selected.marks >= 60
                              ? 'Meets configured demo minimum.'
                              : 'Below configured demo minimum.'
                        },
                        {
                          label: 'Family income (≤ ₹3,00,000)',
                          pass: selected.income <= 300000,
                          detail:
                            selected.income <= 300000
                              ? 'Within configured demo limit.'
                              : 'Exceeds configured demo limit.'
                        },
                        {
                          label: 'Eligible undergraduate enrollment',
                          pass: selected.enrolled,
                          detail: selected.enrolled
                            ? 'Enrollment declared.'
                            : 'Enrollment not confirmed.'
                        },
                        {
                          label: 'Application deadline',
                          pass: selected.deadlineMet,
                          detail: selected.deadlineMet
                            ? 'Deadline met.'
                            : 'Deadline not met.'
                        }
                      ].map(c => (
                        <div className="criterion" key={c.label}>
                          <span className={c.pass ? 'pass' : 'fail'}>
                            {c.pass ? '✓' : '×'}
                          </span>
                          <div>
                            <b>{c.label}</b>
                            <small>{c.detail}</small>
                          </div>
                          <em>{c.pass ? 'PASS' : 'FAIL'}</em>
                        </div>
                      ))}

                      <h3>Evaluator final decision</h3>

                      <label className="field">
                        Decision
                        <select
                          value={decision}
                          onChange={e =>
                            setDecision(
                              e.target.value as
                                | 'APPROVED'
                                | 'REJECTED'
                                | 'NEEDS_INFORMATION'
                                | 'PENDING'
                            )
                          }
                        >
                          <option value="APPROVED">Approve</option>
                          <option value="REJECTED">Reject</option>
                          <option value="NEEDS_INFORMATION">
                            Request more information
                          </option>
                          <option value="PENDING">Keep pending</option>
                        </select>
                      </label>

                      <label className="field">
                        Reason (required)
                        <textarea
                          rows={3}
                          value={reason}
                          onChange={e => setReason(e.target.value)}
                          placeholder="Explain the decision and evidence reviewed"
                        />
                      </label>

                      <button className="primary" onClick={saveDecision}>
                        Record final decision
                      </button>

                      <p className="muted">
                        Local demo only. Backend must validate and persist
                        decisions.
                      </p>
                    </>
                  )}

                  <div className="final">
                    <span>Final decision status</span>
                    <Pill decision={selected.decision} />
                  </div>

                  {selected.decisionReason && (
                    <p className="banner">
                      Decision note: {selected.decisionReason}
                    </p>
                  )}
                </div>
              )}

              {role === 'Applicant' && !ownApps.length && (
                <div className="empty-state panel">
                  <b>You have not submitted an application yet.</b>
                  <button
                    className="primary"
                    onClick={() => setPage('New application')}
                  >
                    Start application
                  </button>
                </div>
              )}
            </>
          )}

          {/* NEW APPLICATION FORM */}
          {page === 'New application' && role === 'Applicant' && (
            <>
              <p className="eyebrow">APPLICANT PORTAL</p>
              <h1>Scholarship application</h1>
              <p className="sub">
                Complete all required fields and attach your supporting
                documents before submitting.
              </p>

              <form
                className="panel form application-form"
                onSubmit={newDemo}
              >
                <div className="form-section">
                  <h2>01 · Personal details</h2>
                  <p>Tell us how to identify and contact you.</p>

                  <div className="form-grid">
                    <label className="field">
                      Full name *
                      <input name="name" required defaultValue={userName} />
                    </label>

                    <label className="field">
                      Email address *
                      <input
                        name="email"
                        required
                        type="email"
                        defaultValue={userEmail}
                      />
                    </label>
                  </div>
                </div>

                <div className="form-section">
                  <h2>02 · Education and eligibility</h2>
                  <p>
                    Enter the details used for this fictional demo scholarship.
                  </p>

                  <div className="form-grid">
                    <label className="field">
                      Course and year *
                      <input
                        name="course"
                        required
                        placeholder="e.g. BSc Computer Science · Year 1"
                      />
                    </label>

                    <label className="field">
                      College / institution *
                      <input
                        name="institution"
                        required
                        placeholder="Enter institution name"
                      />
                    </label>

                    <label className="field">
                      Academic percentage *
                      <input
                        name="marks"
                        required
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="e.g. 78.5"
                      />
                    </label>

                    <label className="field">
                      Annual family income (₹) *
                      <input
                        name="income"
                        required
                        type="number"
                        min="0"
                        placeholder="e.g. 180000"
                      />
                    </label>
                  </div>

                  <label className="check">
                    <input type="checkbox" name="enrolled" required /> I confirm
                    I am enrolled in an eligible undergraduate course. *
                  </label>
                </div>

                <div className="form-section">
                  <h2>03 · Supporting documents</h2>
                  <p>
                    Choose PDF, JPG, or PNG files up to 5 MB each. This demo
                    records filenames only; it does not securely upload or
                    store file contents.
                  </p>

                  {docs.map(({ key, label }) => (
                    <label className="upload-field" key={key}>
                      <span className="upload-icon">↥</span>
                      <span className="upload-copy">
                        <b>{label} *</b>
                        <small>
                          {formFiles[key]
                            ? formFiles[key]!.name
                            : 'PDF, JPG or PNG · maximum 5 MB'}
                        </small>
                      </span>

                      <span className="upload-action">
                        {formFiles[key] ? 'Change file' : 'Choose file'}
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                          required
                          onChange={e => {
                            const file = e.target.files?.[0] || null;

                            if (file && file.size > 5 * 1024 * 1024) {
                              setNotice(
                                'That file is larger than 5 MB. Please choose a smaller file.'
                              );
                              e.currentTarget.value = '';
                              return;
                            }

                            if (
                              file &&
                              ![
                                'application/pdf',
                                'image/jpeg',
                                'image/png'
                              ].includes(file.type)
                            ) {
                              setNotice(
                                'Choose a PDF, JPG, or PNG file.'
                              );
                              e.currentTarget.value = '';
                              return;
                            }

                            setFormFiles(old => ({ ...old, [key]: file }));
                            setNotice('');
                          }}
                        />
                      </span>
                    </label>
                  ))}
                </div>

                <div className="form-consent">
                  <b>Before you submit</b>
                  <p>
                    These criteria are fictional hackathon rules, not official
                    scholarship requirements. A human evaluator makes the final
                    decision. Submitting this demo form only updates local
                    browser state.
                  </p>
                </div>

                <button className="primary submit-application" type="submit">
                  Submit demo application →
                </button>
              </form>
            </>
          )}

          {/* APPLICANT DOCUMENTS PAGE */}
          {page === 'Documents' && role === 'Applicant' && (
            <>
              <p className="eyebrow">DOCUMENT CHECKLIST</p>
              <h1>My documents</h1>
              <p className="sub">
                Review document status for your application. To replace a file
                in this prototype, use the application form and submit a new
                demo application.
              </p>

              {ownApps.length ? (
                ownApps.map(a => (
                  <div className="panel document-card" key={a.id}>
                    <h2>{a.id} · {a.course}</h2>

                    {/* Missing-document warning on Documents page */}
                    {!a.documents.income && <MissingDocumentNote />}

                    {docs.map(({ key, label }) => (
                      <div className="doc" key={key}>
                        <span>
                          <b>{label}</b>
                          <small>
                            {!a.documents[key]
                              ? 'Not submitted'
                              : a.verified[key]
                                ? 'Verified'
                                : 'Awaiting evaluator verification'}
                          </small>
                        </span>

                        <Pill
                          decision={
                            !a.documents[key]
                              ? 'NEEDS_INFORMATION'
                              : a.verified[key]
                                ? 'APPROVED'
                                : 'PENDING'
                          }
                        />
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="empty-state panel">
                  <b>No documents to display yet.</b>
                  <button
                    className="primary"
                    onClick={() => setPage('New application')}
                  >
                    Start application
                  </button>
                </div>
              )}
            </>
          )}

          {/* ADMIN SCHEME SETTINGS */}
          {page === 'Scheme settings' && role === 'Admin' && (
            <>
              <p className="eyebrow">ADMINISTRATION</p>
              <h1>Scheme settings</h1>
              <p className="sub">
                Current demo rules. These values are not persisted or connected
                to the engine.
              </p>

              <div className="panel form">
                <h2>Need-Based Undergraduate Scholarship</h2>
                <p className="sub">
                  Fictional demo criteria — not official scholarship policy.
                </p>
                <p>
                  Minimum academic percentage: <b>60%</b>
                </p>
                <p>
                  Maximum annual family income: <b>₹3,00,000</b>
                </p>
                <p>
                  Required documents: marksheet, income certificate, enrollment
                  certificate.
                </p>
                <p className="muted">
                  Backend should store scheme criteria and apply a versioned
                  configuration.
                </p>
              </div>
            </>
          )}

          {/* AUDIT LOG */}
          {page === 'Audit log' && role !== 'Applicant' && (
            <>
              <p className="eyebrow">ACCOUNTABILITY</p>
              <h1>Activity log</h1>
              <p className="sub">
                Local demo view, not a secure or persistent audit trail.
              </p>

              <div className="panel">
                {apps.map(a => (
                  <div className="audit" key={a.id}>
                    <b>{a.id} · Screening recommendation generated</b>
                    <p>
                      {recLabel(a.recommendation)} — {a.reasons.join(' ')}
                    </p>
                    {a.decisionReason && (
                      <small>
                        Decision: {a.decision}; reason: {a.decisionReason}
                      </small>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <footer>
          ScholarSure · Hackathon prototype
          <span>Demo rules only · human evaluator retains final authority</span>
        </footer>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

function Pill({
  rec,
  decision
}: {
  rec?: Recommendation;
  decision?: string;
}) {
  const text = rec
    ? recLabel(rec)
    : decision === 'PENDING'
      ? 'Pending review'
      : decision === 'NEEDS_INFORMATION'
        ? 'Needs information'
        : decision === 'APPROVED'
          ? 'Approved'
          : decision === 'REJECTED'
            ? 'Rejected'
            : 'Not submitted';

  const cls =
    rec === 'RECOMMEND_APPROVE' || decision === 'APPROVED'
      ? 'green'
      : rec === 'RECOMMEND_REJECT' || decision === 'REJECTED'
        ? 'red'
        : rec === 'NEEDS_HUMAN_REVIEW' || decision === 'NEEDS_INFORMATION'
          ? 'amber'
          : 'gray';

  return <span className={'pill ' + cls}>{text}</span>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact">
      <small>{label}</small>
      <b>{value}</b>
    </div>
  );
}

function MissingDocumentNote() {
  return (
    <div className="missing-document-note">
      <b>⚠ Missing required document: Income Certificate</b>
      <p>
        Your income certificate has not been submitted. Please provide it for
        verification. Your application needs human review until the missing
        document is received.
      </p>
    </div>
  );
}