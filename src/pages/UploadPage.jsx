import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { uploadAPI } from '../api/client';

const ACCEPTED = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
};

export default function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [topicName, setTopicName] = useState('');
  const [subject, setSubject] = useState('');
  const [getPastQuestions, setGetPastQuestions] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      if (!topicName) {
        // Auto-fill topic name from filename
        const name = acceptedFiles[0].name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        setTopicName(name.charAt(0).toUpperCase() + name.slice(1));
      }
    }
  }, [topicName]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !topicName.trim()) return;

    setStatus('uploading');
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('topicName', topicName.trim());
    formData.append('subject', subject.trim());
    formData.append('generatePastQuestionsFlag', String(getPastQuestions));

    try {
      const data = await uploadAPI.upload(formData);
      setResult(data);
      setStatus('success');
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'success' && result) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <CheckCircle className="mx-auto text-green-500 mb-4" size={56} />
        <h2 className="text-2xl font-bold mb-2">Topic Created!</h2>
        <p className="text-gray-600 mb-6">
          Generated <strong>{result.flashcardCount} flashcards</strong> and{' '}
          <strong>{result.quizCount} quiz questions</strong>
          {result.hasPastQuestions ? ' + past exam questions' : ''}.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(`/topics/${result.topicId}`)}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700"
          >
            View Game Plan
          </button>
          <button
            onClick={() => { setStatus('idle'); setFile(null); setResult(null); setTopicName(''); }}
            className="border border-gray-300 px-5 py-2 rounded-lg font-medium hover:bg-gray-50"
          >
            Upload Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Upload Study Material</h1>
      <p className="text-gray-500 mb-8">
        Upload a PDF, Word, or PowerPoint file — Claude will generate flashcards, quizzes, and a game plan automatically.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="text-blue-500" size={28} />
              <div className="text-left">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
          ) : (
            <div>
              <Upload className="mx-auto text-gray-400 mb-3" size={36} />
              <p className="font-medium text-gray-700">
                {isDragActive ? 'Drop it here!' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-sm text-gray-400 mt-1">PDF, DOCX, DOC, PPTX, PPT — up to 50MB</p>
            </div>
          )}
        </div>

        {/* Topic name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Topic Name *</label>
          <input
            type="text"
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            placeholder="e.g. Organic Chemistry — Reaction Mechanisms"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject / Course (optional)</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. BSc Chemistry Year 2"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Past questions toggle */}
        <label className="flex items-start gap-3 cursor-pointer p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
          <input
            type="checkbox"
            checked={getPastQuestions}
            onChange={(e) => setGetPastQuestions(e.target.checked)}
            className="mt-0.5 h-4 w-4 text-blue-600 rounded"
          />
          <div>
            <p className="font-medium text-sm">Generate Past Exam Questions</p>
            <p className="text-xs text-gray-500">
              Claude will generate realistic past exam-style questions based on your topic (takes a bit longer).
            </p>
          </div>
        </label>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!file || !topicName.trim() || status === 'uploading'}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {status === 'uploading' ? (
            <>
              <Loader size={18} className="animate-spin" />
              Processing with AI... (this may take ~30 seconds)
            </>
          ) : (
            <>
              <Upload size={18} />
              Upload & Generate Study Materials
            </>
          )}
        </button>
      </form>
    </div>
  );
}
