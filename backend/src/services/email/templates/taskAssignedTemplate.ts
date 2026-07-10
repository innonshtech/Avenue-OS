import { SendTaskAssignedMailParams } from '../email.types';

export const getTaskAssignedTemplate = (params: SendTaskAssignedMailParams): string => {
  const {
    assigneeName,
    projectName,
    sprintName,
    taskTitle,
    taskKey,
    priority,
    dueDate,
    storyPoints,
    description,
    acceptanceCriteria
  } = params;

  // Render priority badge color
  let priorityColor = '#6B7280'; // Default Medium (Gray)
  if (priority === 'HIGH') priorityColor = '#F59E0B'; // Orange
  if (priority === 'URGENT' || priority === 'CRITICAL') priorityColor = '#EF4444'; // Red
  if (priority === 'LOW') priorityColor = '#10B981'; // Green

  // Format acceptance criteria if it's bulleted or has lists
  // Simple check for new lines to make it look like a list
  const formattedCriteria = acceptanceCriteria
    ? acceptanceCriteria.split('\n').map(line => `<li>${line.trim()}</li>`).join('')
    : '<li>No acceptance criteria provided.</li>';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background-color: #f4f4f5;
        margin: 0;
        padding: 40px;
        color: #18181b;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        overflow: hidden;
      }
      .header {
        background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
        padding: 30px;
        text-align: center;
        color: #ffffff;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        letter-spacing: 0.5px;
      }
      .content {
        padding: 40px;
      }
      .greeting {
        font-size: 18px;
        font-weight: 500;
        margin-bottom: 20px;
      }
      .intro {
        font-size: 15px;
        color: #52525b;
        margin-bottom: 30px;
      }
      .task-card {
        background-color: #fafafa;
        border: 1px solid #e4e4e7;
        border-radius: 8px;
        padding: 24px;
        margin-bottom: 30px;
      }
      .task-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 20px;
      }
      .label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #71717a;
        font-weight: 600;
        margin-bottom: 4px;
      }
      .value {
        font-size: 14px;
        color: #18181b;
        font-weight: 500;
      }
      .badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 9999px;
        font-size: 12px;
        font-weight: 600;
        color: #ffffff;
        background-color: ${priorityColor};
      }
      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: #3f3f46;
        margin-bottom: 8px;
        margin-top: 24px;
      }
      .text-box {
        background-color: #f4f4f5;
        border-radius: 6px;
        padding: 16px;
        font-size: 14px;
        line-height: 1.6;
        color: #3f3f46;
      }
      .criteria-box ul {
        margin: 0;
        padding-left: 20px;
      }
      .criteria-box li {
        margin-bottom: 8px;
      }
      .criteria-box li:last-child {
        margin-bottom: 0;
      }
      .footer {
        padding: 24px;
        text-align: center;
        border-top: 1px solid #f4f4f5;
        color: #71717a;
        font-size: 13px;
      }
      .btn {
        display: inline-block;
        background-color: #4f46e5;
        color: #ffffff;
        text-decoration: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-weight: 500;
        margin-top: 30px;
        text-align: center;
      }
      .btn:hover {
        background-color: #4338ca;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>AvenueOS</h1>
      </div>
      
      <div class="content">
        <div class="greeting">Hello ${assigneeName},</div>
        <div class="intro">
          A new task has been assigned to you by Saket.
        </div>
        
        <div class="task-card">
          <div style="margin-bottom: 24px;">
            <div class="label">Task</div>
            <div class="value" style="font-size: 18px; font-weight: 600;">[${taskKey}] ${taskTitle}</div>
          </div>
          
          <div class="task-grid">
            <div>
              <div class="label">Project</div>
              <div class="value">${projectName}</div>
            </div>
            <div>
              <div class="label">Sprint</div>
              <div class="value">${sprintName}</div>
            </div>
            <div>
              <div class="label">Priority</div>
              <div class="value">
                <span class="badge">${priority}</span>
              </div>
            </div>
            <div>
              <div class="label">Due Date</div>
              <div class="value">${dueDate}</div>
            </div>
            <div>
              <div class="label">Story Points</div>
              <div class="value">${storyPoints}</div>
            </div>
          </div>
          
          <div class="section-title">Description</div>
          <div class="text-box">
            ${description || 'No description provided.'}
          </div>
          
          <div class="section-title">Acceptance Criteria</div>
          <div class="text-box criteria-box">
            <ul>
              ${formattedCriteria}
            </ul>
          </div>
        </div>

        <div style="text-align: center;">
          <a href="#" class="btn">View in AvenueOS</a>
        </div>
      </div>
      
      <div class="footer">
        Regards,<br/>
        <strong>AvenueOS</strong><br/>
        Innonsh Technologies
      </div>
    </div>
  </body>
  </html>
  `;
};
