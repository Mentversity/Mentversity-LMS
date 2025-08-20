'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useProgressStore } from '@/store/progressStore';
import { Topic } from '@/types';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  RotateCw,
  CheckCircle,
} from 'lucide-react';

interface VideoPlayerProps {
  topic: Topic;
  onComplete?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ topic, onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(topic.completed || false);
  const [watchedPercentage, setWatchedPercentage] = useState(0);

  const { markTopicComplete } = useProgressStore();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      const percentage = (video.currentTime / video.duration) * 100;
      setWatchedPercentage(percentage);
      // Mark as complete if 90% watched and not already completed
      if (percentage >= 90 && !isCompleted) {
        handleMarkComplete();
      }
    };

    const updateDuration = () => {
      setDuration(video.duration);
    };

    const handleVideoEnd = () => {
      setIsPlaying(false);
      // Ensure it's marked complete if the video naturally ends
      if (!isCompleted) {
        handleMarkComplete();
      }
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', handleVideoEnd); // Listen for video end

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', handleVideoEnd);
    };
  }, [isCompleted, handleMarkComplete]); // Added handleMarkComplete to dependency array

  // Memoize handleMarkComplete to ensure stable reference
  const handleMarkComplete = React.useCallback(async () => {
    try {
      if (topic.id) { // Ensure topic.id exists before marking complete
        await markTopicComplete(topic.id);
        setIsCompleted(true);
        onComplete?.();
      }
    } catch (error) {
      console.error('Error marking topic complete:', error);
    }
  }, [topic.id, markTopicComplete, onComplete]);


  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = parseFloat(e.target.value) / 100;
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.volume = volume; // Restore previous volume
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const handleSkip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
  };

  const handleFullscreen = () => {
    const videoContainer = videoRef.current?.parentElement; // Get the parent div of the video
    if (videoContainer) {
      if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen();
      } else if ((videoContainer as any).webkitRequestFullscreen) { /* Safari */
        (videoContainer as any).webkitRequestFullscreen();
      } else if ((videoContainer as any).msRequestFullscreen) { /* IE11 */
        (videoContainer as any).msRequestFullscreen();
      }
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full bg-white shadow-md border border-gray-200 rounded-2xl text-gray-900">
      <CardHeader className="px-4 py-3 sm:px-6 sm:py-4"> {/* Adjusted padding */}
        <div className="flex items-center justify-between flex-wrap gap-2"> {/* Added flex-wrap for responsiveness */}
          <CardTitle className="text-lg sm:text-xl font-bold tracking-tight text-gray-900">{topic.title}</CardTitle> {/* Adjusted font size */}
          {isCompleted && (
            <div className="flex items-center text-emerald-500 text-sm sm:text-base"> {/* Adjusted font size */}
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1" /> {/* Adjusted icon size */}
              <span className="font-semibold">Completed</span>
            </div>
          )}
        </div>
        {topic.description && (
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-1">{topic.description}</p> {/* Adjusted font size */}
        )}
      </CardHeader>

      <CardContent className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6"> {/* Adjusted padding and space-y */}
        {/* Video Element */}
        <div className="relative rounded-xl sm:rounded-2xl overflow-hidden aspect-video border border-gray-200 shadow-sm"> {/* Adjusted rounded corners */}
          {topic.videoUrl ? (
            <video
              ref={videoRef}
              src={topic.videoUrl}
              className="w-full h-full object-contain bg-black"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              playsInline // Important for mobile playback
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-400 text-sm sm:text-base"> {/* Adjusted font size */}
              <p>No video available</p>
            </div>
          )}

          {/* Video Controls Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300"> {/* Added focus-within for accessibility */}
            <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 space-y-1 sm:space-y-2"> {/* Adjusted padding and spacing */}
              {/* Progress Bar */}
              <div className="flex items-center space-x-2 text-white text-xs sm:text-sm"> {/* Adjusted font size and spacing */}
                <span>{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={(currentTime / duration) * 100 || 0}
                  onChange={handleSeek}
                  className="flex-1 h-1 sm:h-2 bg-white/30 rounded-full appearance-none cursor-pointer accent-emerald-500" // Adjusted height
                />
                <span>{formatTime(duration)}</span>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 sm:space-x-2"> {/* Adjusted spacing */}
                  <Button size="icon" variant="ghost" className="text-white hover:text-emerald-500 hover:bg-white/20 transition-all duration-200 rounded-full h-8 w-8 sm:h-9 sm:w-9" onClick={handlePlayPause}> {/* Adjusted button size */}
                    {isPlaying ? <Pause className="h-4 w-4 sm:h-5 sm:w-5" /> : <Play className="h-4 w-4 sm:h-5 sm:w-5" />} {/* Adjusted icon size */}
                  </Button>
                  <Button size="icon" variant="ghost" className="text-white hover:text-emerald-500 hover:bg-white/20 transition-all duration-200 rounded-full h-8 w-8 sm:h-9 sm:w-9" onClick={() => handleSkip(-10)}>
                    <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-white hover:text-emerald-500 hover:bg-white/20 transition-all duration-200 rounded-full h-8 w-8 sm:h-9 sm:w-9" onClick={() => handleSkip(10)}>
                    <RotateCw className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <div className="flex items-center space-x-1 sm:space-x-2"> {/* Adjusted spacing */}
                    <Button size="icon" variant="ghost" className="text-white hover:text-emerald-500 hover:bg-white/20 transition-all duration-200 rounded-full h-8 w-8 sm:h-9 sm:w-9" onClick={handleMute}>
                      {isMuted ? <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" /> : <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />}
                    </Button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume * 100}
                      onChange={handleVolumeChange}
                      className="w-16 sm:w-20 h-1 sm:h-2 bg-white/30 rounded-full appearance-none cursor-pointer accent-emerald-500" // Adjusted width and height
                    />
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="text-white hover:text-emerald-500 hover:bg-white/20 transition-all duration-200 rounded-full h-8 w-8 sm:h-9 sm:w-9" onClick={handleFullscreen}>
                  <Maximize className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Information */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm"> {/* Adjusted font size */}
            <span className="text-gray-500 font-semibold uppercase tracking-wider">Watch Progress</span>
            <span className="font-bold text-emerald-500">{Math.round(watchedPercentage)}%</span>
          </div>
          <Progress 
            value={watchedPercentage} 
            className="h-1.5 sm:h-2 bg-gray-200 rounded-full" // Adjusted height
            indicatorClassName="bg-emerald-500 rounded-full" // Ensure indicator is rounded
          />
          <p className="text-xs text-gray-400 font-normal">
            {watchedPercentage >= 90 ? 'Video completed!' : 'Watch 90% to mark as complete'}
          </p>
        </div>

        {/* Manual Complete Button */}
        {!isCompleted && watchedPercentage >= 90 && (
          <Button
            onClick={handleMarkComplete}
            className="w-full bg-emerald-500 text-white font-semibold rounded-full py-2.5 sm:py-3 shadow-md transition-all duration-300 hover:scale-[1.02] hover:bg-emerald-600 hover:shadow-lg text-sm sm:text-base" // Adjusted padding and font size
          >
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" /> {/* Adjusted icon size */}
            Mark as Complete
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
