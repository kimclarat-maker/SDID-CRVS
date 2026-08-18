const docsData = {
  sections: [
    {
      id: "introduction",
      title: "Introduction",
      lastUpdated: "1 day ago",
      content:
        "<p>Welcome to the SDID Enrollment Documentation. This guide will help enrollment officers successfully capture and manage citizen biometric information.</p>",
      subsections: [
        {
          id: "overview",
          title: "Overview",
          content: `<p>The Enrollment Platform is a secure system designed to capture, process, and manage citizens' biometric information through four key modalities:</p>
                    <ol>
                      <li><strong>Citizen Photo</strong> - Facial recognition and identification</li>
                      <li><strong>Iris</strong> - Eye pattern biometric capture</li>
                      <li><strong>Fingerprints</strong> - Digital fingerprint recording</li>
                      <li><strong>Signature</strong> - Digital signature capture</li>
                    </ol>`,
          requirements: `
                        <p>Before starting enrollment, ensure you have:</p>
                        <ol>
                          <li><strong>Officer Account</strong> - An active system account with a current profile photo</li>
                          <li><strong>Enrollment Laptop</strong> - Designated laptop for biometric capture</li>
                          <li><strong>Device Assignment</strong> - Access to all required biometric devices (photo, iris, and fingerprint capture devices)</li>
                        </ol>`,
        },
        {
          id: "getting_started",
          title: "Getting Started",
          content: `<p>Follow these steps to begin the enrollment process:</p>
                    <ol>
                      <li>Open your browser and navigate to <a href="https://sdid.enrollment.dev.nida.gov.rw">Enrollment Platform</a></li>
                      <li>Log in using your officer credentials</li>
                      <li>Allow camera access and take a verification selfie, or use the OTP code sent to your email</li>
                      <li>Access the main dashboard</li>
                      <li>Start citizen enrollment by entering their pre-enrollment number</li>
                      <li>Follow the on-screen instructions to capture biometric data</li>
                    </ol>`,
          //   images: [
          //     {
          //       src: "https://res.cloudinary.com/djjwt8ewl/image/upload/v1759429570/sdid/Enrollment/login_etk1mi.png",
          //       thumb:
          //         "https://res.cloudinary.com/djjwt8ewl/image/upload/v1759429570/sdid/Enrollment/login_etk1mi.png",
          //       title: "Login Page",
          //     },
          //     {
          //       src: "https://res.cloudinary.com/djjwt8ewl/image/upload/v1759429570/sdid/Enrollment/facial-verification_tu64du.png",
          //       thumb:
          //         "https://res.cloudinary.com/djjwt8ewl/image/upload/v1759429570/sdid/Enrollment/facial-verification_tu64du.png",
          //       title: "Facial Verification Page",
          //     },
          //     {
          //       src: "https://res.cloudinary.com/djjwt8ewl/image/upload/v1759429571/sdid/Enrollment/home_te1wux.png",
          //       thumb:
          //         "https://res.cloudinary.com/djjwt8ewl/image/upload/v1759429571/sdid/Enrollment/home_te1wux.png",
          //       title: "Dashboard Page",
          //     },
          //   ],
        },
      ],
    },
    {
      id: "installation",
      title: "Installation",
      content: `<p>Ensure all required biometric devices are properly installed and configured on your enrollment laptop:</p>`,
      subsections: [
        {
          id: "iris_device_setup",
          title: "Iris",
          content: `<p>Iris package is mandatory to be installed in the enrollment laptop with the latest package:</p>
                <ol>
                  <li>Download  <a href="https://drive.google.com/drive/folders/12Uc1KgQnoIgEuPN1C2vP4nuhg9n_D1mS" target="_blank">latest Iris package</a></li>
                  <li>Follow installation guide</li>
                  <li>Download <a href="https://drive.google.com/drive/folders/1_iYkXsPiGNkWCgJ2WPV4HAf_H6DQ8iez" target="_blank">IRIS licence</a></li>
                  <li>Follow installation guide</li>
                </ol>`,
          images: [],
        },
        {
          id: "fingerprint_device_setup",
          title: "Fingerprint",
          content: `<p>Finger print package is mandatory to be installed in the enrollment laptop with the latest package:</p>
                <ol>
                  <li>Download  <a href="https://drive.google.com/drive/folders/17SIqCi3xa6aBYoqP67a5J1tgO-t-jQHv" target="_blank">latest finger print package</a></li>
                  <li>Follow <a href="https://drive.google.com/file/d/1dsevQ_29Wjn_XYbjedt-sSiPJ-0wwZck/view?usp=sharing" target="_blank">installation guide</a></li>
                  <li>Download <a href="https://drive.google.com/file/d/1LNVuTg1eCiUg0mlHBh1LTD-raNsqx5Pb/view?usp=drive_link" target="_blank">Fingerprint licence</a></li>
                 <li>Paste license: WINDOW+R or navigate to C:\Program Files\Crossmatch\BioCoreWebSrv-SDK</li>
                </ol>`,
          images: [],
        },
        {
          id: "offline_service_setup",
          title: "Offline Service",
          content: `<p>Offline package is mandatory to be installed in the enrollment laptop with the latest package:</p>
                <ol>
                  <li>Download  <a href="https://drive.google.com/drive/folders/1-JFqNjD9Cfcl0HafqZ5h0TianM7nZ08g" target="_blank">latest Offline service package</a></li>
                  <li>Follow installation guide</li>
                  <li>Download <a href="https://drive.google.com/file/d/15yTCdz6COo0F1A136y9SeDte92xPd-CD/view?usp=drive_link" target="_blank">Offline licence</a></li>
                  <li>Follow installation guide</li>
                </ol>
                <p>The enrollment system implements intelligent network state management through a local service that dynamically adapts to available connectivity.</p>
                <p><b>Offline Capability</b></p>
          <ol>
                  <li>Biometric data capture functions seamlessly without internet connectivity</li>
                  <li>Local storage of enrollment records when offline</li>
                  <li>Continuous operation regardless of network availability</li>
                </ol>
                <p><b>Automatic Data Synchronization</b></p>
          <ol>
                  <li>Background synchronization when network connectivity is restored</li>
                  <li>Queue management for pending data transmissions</li>
                  <li>Conflict resolution for data consistency</li>
                </ol>
                <p><b>Adaptive Network Handling</b></p>
          <ol>
                  <li>Real-time network state detection</li>
                  <li>Queue management for pending data transmissions</li>
                  <li>Optimized data transmission based on connection quality</li>
                </ol>
                <p><b>Download Local/offline service</b></p>
          <ol>
                  <li>Download <a href="https://drive.google.com/drive/u/3/folders/1-JFqNjD9Cfcl0HafqZ5h0TianM7nZ08g" target="_blank">Latest version</a> </li>
                  <li>Install <a href="https://drive.google.com/drive/u/3/folders/1fOnElJtScpX6iQ5wATYhsAeRMC8mwjln" target="_blank">licence</a> </li>
                </ol>`,
          images: [],
        },
        {
          id: "signature_device_setup",
          title: "Signature",
          content: `<p>No need of any installation for now it is built in the application</p>`,
        },
      ],
    },
    {
      id: "search_prenrollment",
      title: "Search Citizen",
      content: `<p>You can search for citizen information using four different methods:</p>
                <ol>
                  <li>Pre-enrollment Number (PRXXXXXXX)</li>
                  <li>National Identification Number (16 digits)</li>
                  <li>Application Number (8 digits)</li>
                  <li>Custom Search (using personal details)</li>
                </ol>`,
      subsections: [
        {
          id: "prenrollment_number",
          title: "1. Pre-enrollment Number",
          content: `<p>To search using a pre-enrollment number:</p>
                    <ol>
                      <li>Click the 'Enroll' button</li>
                      <li>Select 'Prenrollment Number' as the search type</li>
                      <li>Enter the number in the search field (must start with 'PR')</li>
                      <li>Click 'Search'</li>
                    </ol>
                    <div class="alert alert-info" role="alert">
                      <strong>Format:</strong> PRXXXXXXX (e.g., PR1234567)
                    </div>`,
          //   images: [
          //     {
          //       src: "https://res.cloudinary.com/djjwt8ewl/image/upload/v1759432620/sdid/Enrollment/search-prenrollment_bnbv6l.png",
          //       thumb:
          //         "https://res.cloudinary.com/djjwt8ewl/image/upload/v1759432620/sdid/Enrollment/search-prenrollment_bnbv6l.png",
          //       title: "Search Pre-enrollment",
          //     },
          //     {
          //       src: "https://res.cloudinary.com/djjwt8ewl/image/upload/v1759432934/sdid/Enrollment/prenrollment-search_snvqit.png",
          //       thumb:
          //         "https://res.cloudinary.com/djjwt8ewl/image/upload/v1759432934/sdid/Enrollment/prenrollment-search_snvqit.png",
          //       title: "Pre-enrollment Search Results",
          //     },
          //   ],
        },
        {
          id: "by_bid",
          title: "2. National ID Number",
          content: `<p>Search using the citizen's 16-digit National Identification Number:</p>
                    <ol>
                      <li>Select 'National ID Number' as the search type</li>
                      <li>Enter the exact 16-digit number</li>
                      <li>Click 'Search'</li>
                    </ol>
                    <div class="alert alert-info" role="alert">
                      <strong>Important Notes:</strong>
                      <ul>
                        <li>The National ID number must be exactly 16 digits</li>
                        <li>No spaces or special characters allowed</li>
                        <li>Example: 1992867890123456</li>
                      </ul>
                    </div>`,
          //   images: [
          //     {
          //       src: "https://res.cloudinary.com/djjwt8ewl/image/upload/v1759433624/sdid/Enrollment/nationalid_p0xrca.png",
          //       thumb:
          //         "https://res.cloudinary.com/djjwt8ewl/image/upload/v1759433624/sdid/Enrollment/nationalid_p0xrca.png",
          //       title: "National ID Search",
          //     },
          //   ],
        },
        {
          id: "by_application_number",
          title: "3. Application Number",
          content: `<p>Search using the 8-digit application number from pre-enrollment:</p>
                    <ol>
                      <li>Choose 'Application Number' as the search type</li>
                      <li>Enter the 8-digit number</li>
                      <li>Click 'Search'</li>
                    </ol>
                    <div class="alert alert-info" role="alert">
                      <strong>Note:</strong>
                      <ul>
                        <li>Must be an identifier used during pre-enrollment</li>
                        <li>Exactly 8 digits required</li>
                        <li>No spaces or special characters</li>
                        <li>Example: 12345678</li>
                      </ul>
                    </div>`,
        },
        {
          id: "by_custom",
          title: "4. Custom Search",
          content: `<p>Search using personal details when other identifiers aren't available:</p>
                    <ol>
                      <li>Select 'Custom' as the search type</li>
                      <li>Fill in the available information</li>
                      <li>Click 'Search'</li>
                      <li>Review the results and select the correct candidate</li>
                      <li>Click 'Select' to proceed</li>
                    </ol>
                    <div class="alert alert-info" role="alert">
                      <strong>Field Guidelines:</strong>
                      <ul>
                        <li><strong>Surname</strong> - Required field</li>
                        <li><strong>Postname</strong> - Optional field</li>
                        <li><strong>Date of Birth</strong> - Optional field</li>
                        <li><strong>Father's Names</strong> - Optional (can provide one or both names)</li>
                        <li><strong>Mother's Names</strong> - Optional (can provide one or both names)</li>
                        <li>Ensure information matches pre-enrollment records exactly</li>
                      </ul>
                    </div>`,
        },
      ],
    },
    {
      id: "facial_verification",
      title: "Facial Verification",
      content:
        "<p>Facial verification process to ensure citizen identity matching.</p>",
      subsections: [
        {
          id: "selfie_matching",
          title: "Selfie Matching",
          content:
            "<p>Selfie match with the photo that provided in prenrollment</p>",
          requirements: `
                        <p>Follow this instruction to be make sure selfie matches:</p>
                        <ol>
                          <li><strong>No hat, glasses, etc...</strong> - Make sure there is no object that hindler your face to be full visible</li>
                          <li><strong>Enough Light</strong> - Must be in a place with enough light</li>

                        </ol>`,
        },
        {
          id: "skip_selfie",
          title: "Skip Selfie",
          content: ` <p>Procedures for skipping selfie verification when appropriate.</p>`,
          requirements: `
                        <p>If you take selfie and it does not match with prenrollment photo you can request skip selfie:</p>
                        <ol>
                          <li><strong>Provide active and valid phone number</strong> - Must be including country code</li>
                          <li><strong>Awaiting for supervisor review</strong> - Request must be reviewed by supervisor</li>
                          <li><strong>Receive OTP code</strong> - You will receive OTP code to the provided phone number</li>

                        </ol>`,
        },
      ],
    },
    {
      id: "biometric_capture",
      title: "Biometric Capture",
      content:
        "<p>Enrollment allows officer to capture citizen biometrics includes photo, iris, fingerprints and signature</p>",
      subsections: [
        {
          id: "bio_facial",
          title: "Facial Capture",
          content: `
      <p>Facial biometric capture uses high-resolution photography under controlled conditions to create a standardized facial image template. The system follows ISO/IEC 19794-5 standards for full-frontal facial recognition images.</p>
      <p>Ensure proper lighting, neutral background, and citizen cooperation for optimal facial feature capture. The image must show full face from top of hair to bottom of chin with eyes open and looking directly at the camera.</p>
    `,
          requirements: `
      <ol>
        <li><strong>Camera Specifications:</strong> Use minimum 4K resolution camera with proper lighting setup</li>
        <li><strong>Positioning:</strong> Ensure citizen faces camera directly with shoulders squared and head centered in frame</li>
        <li><strong>Expression:</strong> Neutral expression with mouth closed, eyes fully open and clearly visible</li>
        <li><strong>Accessories:</strong> Remove hats, sunglasses, or any obstructions that obscure facial features</li>
        <li><strong>Lighting Conditions:</strong> Even illumination without shadows, glare, or extreme contrasts</li>
        <li><strong>Background:</strong> Plain light-colored background without patterns or distracting elements</li>
        <li><strong>Religious Accommodations:</strong> For religious head coverings, ensure full facial features remain visible</li>
        <li><strong>Quality Validation:</strong> Verify image meets all technical specifications before acceptance</li>
      </ol>
    `,
        },
        {
          id: "bio_iris",
          title: "Iris Capture",
          content: `
      <p>The iris scanner must be properly connected to the enrollment laptop. When connected correctly, the device's internal white positioning light will illuminate. During capture initiation, red scanning lights will activate to indicate active biometric acquisition.</p>
      <p>The device features automated eye detection technology. When it identifies eyes within its field of view, it automatically begins capturing and displays the iris images on the screen in real-time. Ensure the citizen maintains steady positioning.</p>
    `,
          requirements: `
      <ol>
        <li><strong>Device Connection:</strong> Verify the iris scanner is securely connected to the enrollment laptop via USB and recognized by the system</li>
        <li><strong>Positioning Lights:</strong> White positioning lights indicate device readiness; red scanning lights activate during capture process</li>
        <li><strong>Optimal Distance:</strong> Position citizen approximately 10-15 cm (4-6 inches) from the device for clear iris imaging</li>
        <li><strong>Eye Alignment:</strong> Ensure citizen's eyes are level with the scanner and fully visible without obstructions</li>
        <li><strong>Visual Feedback:</strong> Monitor the screen for real-time image display</li>
        <li><strong>Special Cases:</strong> For citizens missing one or both eyes, request official medical documentation or disability certification</li>
        <li><strong>Environmental Conditions:</strong> Ensure adequate lighting without direct glare or reflections that could interfere with capture</li>
        <li><strong>Quality Validation:</strong> Verify captured images meet quality standards before proceeding to next biometric</li>
      </ol>
    `,
        },
        {
          id: "bio_fingerprint",
          title: "Fingerprint Capture",
          content: `
      <p>Fingerprint capture requires all ten fingerprints to be recorded using a certified fingerprint scanner. The system follows the standard sequence (LTR) starting with  Left four fingers, Right four fingers and then 2 Thumbs </p>
      <p>Ensure the citizen's fingers are clean, dry, and free from temporary obstructions like dirt, ink, or excessive moisture that could affect print quality. The scanner surface should be regularly cleaned between enrollments to maintain optimal performance.</p>
    `,
          requirements: `
      <ol>
        <li><strong>Scanner Preparation:</strong> Clean the fingerprint scanner surface with approved cleaning solution before each enrollment session</li>
        <li><strong>Finger Condition:</strong> Verify citizen's fingers are clean, dry, and free from temporary marks, cuts, or obstructions</li>
        <li><strong>Capture Sequence:</strong> Follow systematic order (LTR): Left hand to Right hand and 2 Thumbs</li>
        <li><strong>Proper Technique:</strong> Apply firm, even pressure without rolling or smudging during capture</li>
        <li><strong>Quality Indicators:</strong> Monitor real-time indicators on-the screen as well as on the device for each fingerprint and recapture if below acceptable thresholds</li>
        <li><strong>Special Circumstances:</strong> For worn, scarred, or missing fingerprints, document the condition and capture best available prints</li>
        <li><strong>Position Guidance:</strong> Assist citizen in proper finger placement using on-screen positioning guides and visual aids</li>
        <li><strong>Validation Check:</strong> Review captured prints for completeness and clarity before finalizing the enrollment</li>
      </ol>
    `,
        },
        {
          id: "bio_signature",
          title: "Signature Capture",
          content: `
      <p>Digital signature capture provides an electronic representation of the citizen's handwritten signature using a signature pad. The captured signature serves as legal acknowledgment and identity verification.</p>
      <p>The system records signature dynamics including pressure, speed, and stroke sequence where supported by the capture device. Ensure the citizen provides their consistent, customary signature matching their official identification documents.</p>
    `,
          requirements: `
      <ol>
        <li><strong>Device Setup:</strong> Connect device to the hub and click connect, you should see window popup and choose STU and then start capturing</li>
        <li><strong>Signature Area:</strong> Ensure adequate space and comfortable positioning for natural signature execution</li>
        <li><strong>Consistency Check:</strong> Compare with signature on provided identification documents for consistency</li>
        <li><strong>Quality Standards:</strong> Capture clear, complete signature without smudging, interruptions, or incomplete strokes</li>
        <li><strong>Legal Compliance:</strong> Ensure signature is provided willingly and matches the citizen's legal signing identity</li>
        <li><strong>Special Accommodations:</strong> Provide assistance for citizens with physical limitations affecting signature ability</li>
        <li><strong>Documentation:</strong> For citizens unable to sign, document the reason and follow alternative verification procedures</li>
        <li><strong>Final Verification:</strong> Confirm signature clarity and legibility before saving to the enrollment record</li>
      </ol>
    `,
        },
      ],
    },
  ],
};
