// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import BlogManagement from "../../components/organisms/BlogManagement/BlogManagement";
import Scrollable from "../../components/molecules/Scrollable/Scrollable";

export default function CreateUserPostView() {
  return <div className="create-article-view">
    <Scrollable>
      <div className="create-article-view-inner">
        <BlogManagement />
      </div>
    </Scrollable>
  </div>;
}