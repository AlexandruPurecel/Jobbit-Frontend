import React, { useState, useEffect } from 'react';
import { createReview, getReviewsForUser, getUserReviewStats, deleteReview, updateReview } from '../../api/ReviewApi';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const StarRating = ({ rating, size = 'md', interactive = false, onRatingChange = null }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };


  const handleStarClick = (newRating) => {
    if (interactive && onRatingChange) {
      onRatingChange(newRating);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleStarClick(star)}
          disabled={!interactive}
          className={`${sizeClasses[size]} ${
            interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'
          }`}
        >
          <svg
            fill={star <= rating ? '#FCD34D' : '#E5E7EB'}
            stroke={star <= rating ? '#F59E0B' : '#9CA3AF'}
            strokeWidth={1}
            viewBox="0 0 24 24"
            className="drop-shadow-sm"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </button>
      ))}
    </div>
  );
};

// Edit Review Form Component
const EditReviewForm = ({ review, onReviewUpdated, onCancel }) => {
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await updateReview(review.reviewId, {
        rating,
        comment,
        reviewedUserId: review.reviewedUserId
      });

      if (response.status === 200) {
        const updatedReview = response.data;
        onReviewUpdated(updatedReview);
        onCancel();
      }
    } catch (error) {
      console.error('Error updating review:', error);
      setError(error.response?.data || 'Failed to update review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-blue-50 rounded-xl border border-blue-200 shadow-sm p-4 mt-2">
      <h5 className="text-sm font-semibold text-gray-800 mb-3">Edit your review</h5>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Rating *
          </label>
          <div className="flex items-center gap-2">
            <StarRating
              rating={rating}
              size="md"
              interactive={true}
              onRatingChange={setRating}
            />
            <span className="text-xs text-gray-500">
              {rating > 0 && `${rating} star${rating !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Comment (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Update your experience..."
          />
        </div>

        {error && (
          <div className="text-red-600 text-xs bg-red-50 p-2 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 text-xs text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Updating...' : 'Update Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ReviewCard Component with edit functionality
const ReviewCard = ({ review, isAdmin, currentUserId, onReviewDeleted, onReviewUpdated }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteReview(review.reviewId);
      onReviewDeleted(review.reviewId);
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const isOwnReview = currentUserId && currentUserId === review.reviewerId;
  const navigate = useNavigate();

  const handleUserClick = () => {
    navigate(`/user/${review.reviewerId}`);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all duration-300 relative">
      {/* Action Buttons */}
      <div className="absolute top-4 right-4 flex gap-2">
        {/* Edit button for own reviews */}
        {isOwnReview && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit your review"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        
        {/* Admin Delete Button */}
        {isAdmin && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Delete Review (Admin Only)"
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        )}
      </div>

      <div className="flex items-start gap-4">
        <img
          src={
            review.reviewerProfilePictureId
              ? `http://localhost:8080/api/images/${review.reviewerProfilePictureId}`
              : "/images/defaultImage.jpg"
          }
          alt={`${review.reviewerFirstName} ${review.reviewerLastName}`}
          className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 cursor-pointer hover:border-blue-300 transition-colors"
          onClick={handleUserClick}
        />
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-semibold text-gray-800">
                {review.reviewerFirstName} {review.reviewerLastName}
                {isOwnReview && <span className="text-xs text-blue-500 ml-2">(You)</span>}
              </h4>
              <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
            </div>
            <StarRating rating={review.rating} size="sm" />
          </div>
          
          {review.comment && (
            <p className="text-gray-700 leading-relaxed">{review.comment}</p>
          )}

          {/* Edit Form */}
          {isEditing && (
            <EditReviewForm
              review={review}
              onReviewUpdated={onReviewUpdated}
              onCancel={() => setIsEditing(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const ReviewStats = ({ stats }) => {
  const getPercentage = (count) => {
    if (stats.totalReviews === 0) return 0;
    return (count / stats.totalReviews) * 100;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="text-center mb-6">
        <div className="text-4xl font-bold text-gray-800 mb-2">
          {stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
        </div>
        <StarRating rating={Math.round(stats.averageRating || 0)} size="lg" />
        <p className="text-sm text-gray-500 mt-2">
          Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
        </p>
      </div>

      {stats.totalReviews > 0 && (
        <div className="space-y-2">
          {[
            { stars: 5, count: stats.fiveStars },
            { stars: 4, count: stats.fourStars },
            { stars: 3, count: stats.threeStars },
            { stars: 2, count: stats.twoStars },
            { stars: 1, count: stats.oneStar }
          ].map(({ stars, count }) => (
            <div key={stars} className="flex items-center gap-2 text-sm">
              <span className="w-8 text-gray-600">{stars}★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getPercentage(count)}%` }}
                />
              </div>
              <span className="w-8 text-gray-500 text-right">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Direct Review Form Component
const DirectReviewForm = ({ reviewedUserId, reviewedUserName, onReviewAdded, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await createReview({
        rating,
        comment,
        reviewedUserId
      });

      if (response.status === 200) {
        const newReview = response.data;
        onReviewAdded(newReview);
        setRating(0);
        setComment('');
        onCancel();
      }
    } catch (error) {
      console.error('Error creating review:', error);
      setError(error.response?.data || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-6 mb-4">
      <h4 className="text-lg font-semibold text-gray-800 mb-4">
        Write a review for {reviewedUserName}
      </h4>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          <div className="flex items-center gap-2">
            <StarRating
              rating={rating}
              size="lg"
              interactive={true}
              onRatingChange={setRating}
            />
            <span className="text-sm text-gray-500 ml-2">
              {rating > 0 && `${rating} star${rating !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comment (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            placeholder="Share your experience..."
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

const ReviewSection = ({ userId, userName, currentUserId, onUserStatsUpdate }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchStats();
    checkAdminRole();
  }, [userId]);

  const checkAdminRole = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setIsAdmin(decoded.role === 'ADMIN');
      } catch (error) {
        console.error('Error decoding token for role:', error);
        setIsAdmin(false);
      }
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await getReviewsForUser(userId);
      if (response.status === 200) {
        setReviews(response.data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Failed to load reviews');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getUserReviewStats(userId);
      if (response.status === 200) {
        setStats(response.data);
        if (onUserStatsUpdate) {
          onUserStatsUpdate({
            averageRating: response.data.averageRating,
            totalReviews: response.data.totalReviews
          });
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAdded = (newReview) => {
    setReviews(prev => [newReview, ...prev]);
    fetchStats(); // This will trigger onUserStatsUpdate
  };

  const handleReviewUpdated = (updatedReview) => {
    setReviews(prev => prev.map(review => 
      review.reviewId === updatedReview.reviewId ? updatedReview : review
    ));
    fetchStats(); // This will trigger onUserStatsUpdate
  };

  const handleReviewDeleted = (reviewId) => {
    setReviews(prev => prev.filter(review => review.reviewId !== reviewId));
    fetchStats(); // This will trigger onUserStatsUpdate
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const canAddReview = currentUserId && currentUserId !== parseInt(userId) && 
    !reviews.some(review => review.reviewerId === currentUserId);

  return (
    <div className="mt-8 bg-gradient-to-br from-white to-purple-50 rounded-2xl p-6 shadow-sm border border-purple-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <div className="bg-purple-100 p-2 rounded-lg mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          Reviews for {userName}
        </h3>
        
        {canAddReview && !showReviewForm && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            Write Review
          </button>
        )}
      </div>

      {/* Direct Review Form */}
      {showReviewForm && canAddReview && (
        <DirectReviewForm
          reviewedUserId={userId}
          reviewedUserName={userName}
          onReviewAdded={handleReviewAdded}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          {stats && <ReviewStats stats={stats} />}
        </div>
        <div className="lg:col-span-2">
          {/* Empty space or summary info */}
        </div>
      </div>

      {/* Reviews list - full width below the stats */}
      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map(review => (
            <ReviewCard 
              key={review.reviewId} 
              review={review} 
              isAdmin={isAdmin}
              currentUserId={currentUserId}
              onReviewDeleted={handleReviewDeleted}
              onReviewUpdated={handleReviewUpdated}
            />
          ))
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">No reviews yet</p>
          <p className="text-gray-400 text-sm mt-2">Be the first to review {userName}!</p>
        </div>
        )}
      </div>
    </div>
  );
};

export { StarRating, ReviewCard, ReviewStats, DirectReviewForm, ReviewSection };