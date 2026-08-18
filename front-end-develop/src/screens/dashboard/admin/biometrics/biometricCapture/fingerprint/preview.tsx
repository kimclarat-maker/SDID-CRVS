import { getMediaById } from "@/api/media";
import { LanguageContext } from "@/context/LanguageContext";
import { isUUID } from "@/utils/common/uuid";
import React, { useContext, useEffect, useState } from "react";
import { Col, Grid, Row, Stack, Tag } from "rsuite";

interface Props {
  fingerData: any;
}

const PreviewFingerprint: React.FC<Props> = ({ fingerData }) => {
  const { translation } = useContext(LanguageContext);
  const [resolvedImages, setResolvedImages] = useState<Record<string, any>>({});

  const DISPLAY_SECTIONS = [
    // {
    //   title: translation.slap_capture,
    //   fingers: [
    //     { pos: "LeftFourFingers", label: "Left Four Fingers" },
    //     { pos: "RightFourFingers", label: "Right Four Fingers" },
    //     { pos: "BothThumbs", label: "Both Thumbs" },
    //   ],
    //   cols: { xs: 24, sm: 8 },
    // },
    {
      title: translation.left_hand_individual_fingers,
      fingers: [
        { pos: "LeftThumb", label: "Left Thumb" },
        { pos: "LeftIndex", label: "Left Index" },
        { pos: "LeftMiddle", label: "Left Middle" },
        { pos: "LeftRing", label: "Left Ring" },
        { pos: "LeftLittle", label: "Left Little" },
      ],
      cols: { xs: 24, sm: 8, md: 4.8 },
    },
    {
      title: translation.right_hand_individual_fingers,
      fingers: [
        { pos: "RightThumb", label: "Right Thumb" },
        { pos: "RightIndex", label: "Right Index" },
        { pos: "RightMiddle", label: "Right Middle" },
        { pos: "RightRing", label: "Right Ring" },
        { pos: "RightLittle", label: "Right Little" },
      ],
      cols: { xs: 24, sm: 8, md: 4.8 },
    },
  ];

  const getFingerData = (pos: string) => {
    if (!fingerData) return null;
    const exactMatch = fingerData[pos];
    if (exactMatch) return exactMatch;

    const variations = [
      pos.toLowerCase(),
      pos.charAt(0).toLowerCase() + pos.slice(1),
      pos.charAt(0).toUpperCase() + pos.slice(1),
    ];

    for (const variation of variations) {
      if (fingerData[variation]) {
        return fingerData[variation];
      }
    }

    return null;
  };

  // ✅ Preload all media and store resolved images
  useEffect(() => {
    const loadImages = async () => {
      const results: Record<string, any> = {};

      for (const section of DISPLAY_SECTIONS) {
        for (const { pos } of section.fingers) {
          const finger = getFingerData(pos);

          if (!finger) continue;

          let image = finger.imgSrc || finger.base64 || finger;

          if (isUUID(image)) {
            try {
              const res = await getMediaById({ mediaId: image });
              image = `data:image/jpeg;base64,${res}`;
            } catch (err) {
              console.warn(`Failed to load image for ${pos}`, err);
            }
          }

          results[pos] = { ...finger, resolvedImage: image };
        }
      }

      setResolvedImages(results);
    };

    loadImages();
  }, [fingerData]);

  const renderFingerPanel = (pos: string, label: string) => {
    const finger = resolvedImages[pos];
    const hasImage = !!finger?.resolvedImage;

    return (
      <div
        className="text-center"
        style={{
          height: "100%",
          marginBottom: "16px",
          border: "1px solid var(--rs-gray-100)",
          borderRadius: "1rem",
          backgroundColor: hasImage
            ? "var(--rs-gray-50)"
            : "var(--rs-gray-100)",
        }}
      >
        <div style={{ padding: "10px" }}>
          {hasImage ? (
            <img
              src={finger.resolvedImage}
              alt={label}
              style={{
                maxWidth: "100%",
                height: "auto",
                marginBottom: "10px",
                aspectRatio: "2/2",
                borderRadius: "0.5rem",
              }}
            />
          ) : (
            <div
              style={{
                height: "120px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--rs-gray-500)",
                fontStyle: "italic",
              }}
            >
              {translation.no_image_captured}
            </div>
          )}

          <div>
            {label && <Tag color={hasImage ? "blue" : "red"}>{label}</Tag>}
            {finger?.quality !== undefined && finger.quality !== "N/A" && (
              <div style={{ marginTop: "5px" }}>
                <Tag color="green">Quality: {finger.quality}</Tag>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderRequirements = () => (
    <Stack spacing={16}>
      <Stack.Item>
        <Tag color="blue" style={{ marginBottom: "8px" }}>
          {translation.captured}
        </Tag>
      </Stack.Item>
      <Stack.Item>
        <Tag color="red" style={{ marginBottom: "8px" }}>
          {translation.not_captured}
        </Tag>
      </Stack.Item>
    </Stack>
  );

  return (
    <div>
      <Grid fluid>
        {DISPLAY_SECTIONS.map((section, sectionIndex) => (
          <div key={sectionIndex} style={{ marginBottom: "24px" }}>
            <div
              style={{
                marginBottom: "16px",
                padding: "8px 0",
                borderBottom: "2px solid var(--rs-gray-200)",
              }}
            >
              <h5 style={{ margin: 0, color: "var(--rs-gray-800)" }}>
                {section.title}
              </h5>
            </div>

            <Row gutter={16}>
              {section.fingers.map(({ pos, label }) => (
                <Col key={pos} {...section.cols}>
                  {renderFingerPanel(pos, label)}
                </Col>
              ))}
            </Row>
          </div>
        ))}
      </Grid>
    </div>
  );
};

export default PreviewFingerprint;
