import { useState, useEffect } from "react";
import mapsData from "./assets/iw3/maps.json";

interface ImageData {
  path: string;
  mapId: string;
  mapName: string;
}

const mapsList = Object.entries(mapsData).map(([id, name]) => ({
  id,
  name,
}));

export function App() {
  const [allImages, setAllImages] = useState<ImageData[]>([]);
  const [unseenImages, setUnseenImages] = useState<ImageData[]>([]);
  const [currentImage, setCurrentImage] = useState<ImageData | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadAllImages = async (): Promise<ImageData[]> => {
    const modules = import.meta.glob("/src/assets/iw3/**/*.png", {
      eager: true,
    });

    const images: ImageData[] = [];

    Object.keys(modules).forEach((path) => {
      const mapId = Object.keys(mapsData).find((id) =>
        path.includes(`/${id}/`),
      );
      if (mapId) {
        images.push({
          path: (modules[path] as any).default || path,
          mapId,
          mapName: mapsData[mapId as keyof typeof mapsData],
        });
      }
    });

    console.log(`Loaded ${images.length} total images`);
    return images;
  };

  const pickRandomImage = () => {
    if (allImages.length === 0) return;

    setSelectedAnswer("");

    // Reset if all images have been seen
    const availableImages = unseenImages.length > 0 ? unseenImages : allImages;

    const randomIndex = Math.floor(Math.random() * availableImages.length);
    const randomImage = availableImages[randomIndex];

    // Remove the selected image from unseen list
    if (unseenImages.length > 0) {
      setUnseenImages((prev) =>
        prev.filter((_, index) => index !== randomIndex),
      );
    } else {
      // Starting fresh, remove from full list
      setUnseenImages(allImages.filter((_, index) => index !== randomIndex));
    }

    setCurrentImage(randomImage);
  };

  const handleAnswer = (mapName: string) => {
    if (selectedAnswer) return;

    setSelectedAnswer(mapName);
    setTotalAttempts((prev) => prev + 1);

    if (mapName === currentImage?.mapName) {
      setScore((prev) => prev + 1);
    }
  };

  const nextRound = () => {
    pickRandomImage();
  };

  useEffect(() => {
    loadAllImages().then((images) => {
      setAllImages(images);
      setUnseenImages(images.slice(1)); // All except the first one we'll show
      setLoading(false);
      if (images.length > 0) {
        setCurrentImage(images[0]);
      }
    });
  }, []);

  const isCorrect = selectedAnswer === currentImage?.mapName;
  const hasAnswered = !!selectedAnswer;

  const getButtonClass = (mapName: string) => {
    const base =
      "px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 text-left ";

    if (!hasAnswered) {
      return base + "bg-gray-700 text-white hover:bg-blue-600 active:scale-95";
    }

    if (mapName === currentImage?.mapName) {
      return base + "bg-green-600 text-white";
    }

    if (mapName === selectedAnswer) {
      return base + "bg-red-600 text-white";
    }

    return base + "bg-gray-600 text-gray-300 cursor-not-allowed";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <div className="text-2xl">Loading images...</div>
      </div>
    );
  }

  if (!currentImage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <div className="text-2xl">No images found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold">COD4 Map Guesser</h1>
          <div className="flex justify-center gap-8 text-xl">
            <span className="rounded-lg bg-green-600 px-4 py-2">
              Score: {score}
            </span>
            <span className="rounded-lg bg-blue-600 px-4 py-2">
              Attempts: {totalAttempts}
            </span>
            {totalAttempts > 0 && (
              <span className="rounded-lg bg-purple-600 px-4 py-2">
                Accuracy: {Math.round((score / totalAttempts) * 100)}%
              </span>
            )}
            <span className="rounded-lg bg-gray-700 px-4 py-2">
              {unseenImages.length === 0 && allImages.length > 0
                ? "All images seen!"
                : `${allImages.length - unseenImages.length}/${allImages.length}`}
            </span>
          </div>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-3">
          <div className="overflow-hidden rounded-lg bg-gray-800 shadow-2xl lg:col-span-2">
            <img
              src={currentImage.path}
              alt="Guess the map"
              className="h-auto max-h-[600px] w-full object-contain"
            />
          </div>

          <div className="space-y-4">
            <h2 className="mb-4 text-2xl font-semibold">Which map is this?</h2>

            <div className="grid grid-cols-2 gap-2">
              {mapsList
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((map) => (
                  <button
                    key={map.id}
                    onClick={() => handleAnswer(map.name)}
                    disabled={hasAnswered}
                    className={getButtonClass(map.name)}
                  >
                    {map.name}
                  </button>
                ))}
            </div>

            {hasAnswered && (
              <div className="mt-6 rounded-lg bg-gray-800 p-4">
                <p className="mb-3 text-xl">
                  {isCorrect ? (
                    <span className="font-bold text-green-400">✓ Correct!</span>
                  ) : (
                    <span className="font-bold text-red-400">
                      ✗ Wrong! The correct answer was {currentImage.mapName}
                    </span>
                  )}
                </p>
                <button
                  onClick={nextRound}
                  className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  Next Round
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
