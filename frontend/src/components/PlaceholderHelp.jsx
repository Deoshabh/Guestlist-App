import React from 'react';

/**
 * PlaceholderHelp Component
 * 
 * A reusable component to display help information about available placeholders
 * 
 * @param {Object} props
 * @param {boolean} props.compact - Whether to show in compact mode
 * @param {string} props.className - Additional class names
 */
const PlaceholderHelp = ({ compact = false, className = '' }) => {
  const placeholders = [
    { id: 'name', label: 'Full Name', value: '{{name}}', description: 'Replaced with the guest\'s full name' },
    { id: 'firstname', label: 'First Name', value: '{{firstname}}', description: 'Replaced with the guest\'s first name only' },
    { id: 'email', label: 'Email', value: '{{email}}', description: 'Replaced with the guest\'s email address' },
    { id: 'phone', label: 'Phone', value: '{{phone}}', description: 'Replaced with the guest\'s phone number' },
    { id: 'group', label: 'Group Name', value: '{{group}}', description: 'Replaced with the name of the guest\'s group' },
    { id: 'date', label: 'Current Date', value: '{{date}}', description: 'Replaced with the current date' },
    { id: 'time', label: 'Current Time', value: '{{time}}', description: 'Replaced with the current time' },
    { id: 'year', label: 'Current Year', value: '{{year}}', description: 'Replaced with the current year' }
  ];

  const firstname = 'FIRSTNAME';
  const group = 'GROUP_NAME';
  const date = 'EVENT_DATE';

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 ${className}`}>
      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Placeholder Reference</h3>
      
      {compact ? (
        <div className="grid grid-cols-2 gap-2 text-sm">
          {placeholders.map(placeholder => (
            <div key={placeholder.id} className="flex items-center">
              <code className="text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs mr-2">
                {placeholder.value}
              </code>
              <span className="text-gray-700 dark:text-gray-300">{placeholder.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2">Placeholder</th>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2">Description</th>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2">Example Usage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {placeholders.map(placeholder => (
              <tr key={placeholder.id} className="text-sm">
                <td className="py-2">
                  <code className="text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-gray-700 px-1 rounded">
                    {placeholder.value}
                  </code>
                </td>
                <td className="py-2 text-gray-700 dark:text-gray-300">{placeholder.description}</td>
                <td className="py-2 text-gray-600 dark:text-gray-400 italic">
                  {placeholder.id === 'name' && 'Hello {{name}}, welcome!'}
                  {placeholder.id === 'firstname' && 'Hi {{firstname}}!'}
                  {placeholder.id === 'email' && 'Your email is {{email}}'}
                  {placeholder.id === 'phone' && 'We\'ll call you at {{phone}}'}
                  {placeholder.id === 'group' && 'You\'re in the {{group}} group'}
                  {placeholder.id === 'date' && 'Today is {{date}}'}
                  {placeholder.id === 'time' && 'Current time: {{time}}'}
                  {placeholder.id === 'year' && 'Copyright {{year}}'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        <p>
          <strong>Tip:</strong> You can combine multiple placeholders in a message. 
          For example: "Hello {{firstname}}, we're excited to see you at the {{group}} event on {{date}}!"
        </p>
      </div>
    </div>
  );
};

export default PlaceholderHelp;
