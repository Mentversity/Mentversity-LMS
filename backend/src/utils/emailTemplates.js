// utils/emailTemplates.js
exports.accountWelcomeEmail = ({ name, email, password, role, courses }) => {
  const displayName = name || email;
  const courseList = courses.length > 0
    ? `<ul style="margin:8px 0 0 0; padding-left:1em; color:#333;">${courses.map(c=>`<li>${c}</li>`).join('')}</ul>`
    : '<em>No courses assigned yet.</em>';

  return `
    <div style="font-family:'Nunito Sans',Arial,sans-serif; max-width:480px; margin:auto; background:#f9f9f9; color:#222; border-radius:12px; border:1px solid #eee; box-shadow:0 2px 8px rgba(0,0,0,0.07); padding:24px;">
      <h2 style="color:#05d6ac; margin-bottom:8px;">Welcome to Mentversity!</h2>
      <p>Hello <strong>${displayName}</strong>,</p>
      <p>Your ${role} account has been successfully created.</p>
      <div style="background:#fff; border-radius:8px; padding:16px 18px; margin:12px 0; font-size:16px;">
        <div>
          <strong>Email:</strong> ${email}
        </div>
        <div>
          <strong>Password:</strong> ${password ? password : '<em>[Set via reset invitation]</em>'}
        </div>
        <div>
          <strong>Role:</strong> ${role.charAt(0).toUpperCase()+role.slice(1)}
        </div>
        <div>
          <strong>${role === 'student' ? 'Enrolled Courses:' : 'Assigned Courses:'}</strong>
          ${courseList}
        </div>
      </div>
      <p style="color:#666;">Login <a href="https://mentversity.com/login" style="color:#05d6ac;">here</a> and start learning!</p>
      <p style="margin-top:24px; font-size:13px; color:#888;">If this wasn't you, contact our support immediately.</p>
    </div>
  `;
};
