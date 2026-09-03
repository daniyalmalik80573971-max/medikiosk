import { useState, useEffect } from 'react';
import axios from 'axios';
import PatientLayout from '../../components/Layout/PatientLayout';
import { FileText, FileUp, Eye, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PatientDocuments() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    axios.get('/api/documents/my-documents').then(res => setDocs(res.data.documents)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleUpload = async (file) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('document', file);
    fd.append('documentType', 'other');
    try {
      const res = await axios.post('/api/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setDocs(prev => [res.data.document, ...prev]);
      toast.success('Document uploaded!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const getDocIcon = (type) => {
    const icons = { prescription: '💊', lab_report: '🧪', discharge_summary: '🏥', xray: '🩻', scan: '📷', other: '📄' };
    return icons[type] || '📄';
  };

  return (
    <PatientLayout>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
            <p className="text-sm text-gray-500">{docs.length} documents uploaded</p>
          </div>
        </div>

        {/* Upload Area */}
        <div className="border-2 border-dashed border-blue-300 rounded-2xl p-8 text-center mb-6 hover:border-blue-400 transition-colors">
          <FileUp className="w-10 h-10 text-blue-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-3">Upload prescriptions, lab reports, or medical documents</p>
          <label className="cursor-pointer">
            <span className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              {uploading ? 'Uploading...' : 'Upload Document'}
            </span>
            <input type="file" accept="image/*,.pdf" className="hidden" disabled={uploading}
              onChange={(e) => { if (e.target.files[0]) handleUpload(e.target.files[0]); }} />
          </label>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading documents...</div>
        ) : docs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <FileText className="w-16 h-16 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No documents uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs.map((doc) => (
              <div key={doc._id} className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{getDocIcon(doc.documentType)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{doc.originalName}</p>
                    <p className="text-xs text-gray-400 capitalize">{doc.documentType?.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    doc.ocrStatus === 'completed' ? 'bg-green-100 text-green-700' :
                    doc.ocrStatus === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {doc.ocrStatus === 'completed' ? '✓ OCR Done' :
                     doc.ocrStatus === 'processing' ? '⏳ Processing' : '⏳ Pending'}
                  </span>
                  {doc.ocrText && (
                    <button onClick={() => setSelectedDoc(selectedDoc?._id === doc._id ? null : doc)}
                      className="text-blue-600 text-xs flex items-center gap-1 hover:underline">
                      <Eye className="w-3 h-3" /> View Text
                    </button>
                  )}
                </div>
                {selectedDoc?._id === doc._id && doc.ocrText && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Extracted Text (OCR):</p>
                    <p className="text-xs text-gray-600 whitespace-pre-wrap">{doc.ocrText.slice(0, 500)}{doc.ocrText.length > 500 ? '...' : ''}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
